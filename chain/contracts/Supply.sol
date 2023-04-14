// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
// pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./libraries/SignatureUtils.sol";

// todo implement fee
// add max loan time parameter (2/4 years?)
// todo optimize with tight variable packing

// future feature: allow to borrow from repaid loan with signature
// future feature: secondary loan market (allow selling of loans with signature)

struct LoanOffer {
    address owner;
    address token;
    uint256 offerId; // uint16?
    uint256 nonce; // uint16?
    uint256 minLoanAmount;
    uint256 amount;
    uint256 interestRateBPS; // uint16 (max value 65535)
    uint256 expiration; // uint32 (max year 2106)
    uint256 minLoanDuration; // uint32
    uint256 maxLoanDuration; // uint32
}

struct Loan {
    address token;
    uint256 amount;
    uint32 startTime;
    uint32 minRepayTime;
    uint32 expiration;
    uint32 interestRateBPS;
}

contract Supply is ERC721, Ownable, SignUtils {
    //todo remove EnumerableSet and use mapping as in latest ERC721.sol

    mapping(bytes32 => uint256) private _offerNonces;
    mapping(bytes32 => uint256) private _offerAmountBorrowed;
    mapping(uint256 => uint256) private _claimable;
    mapping(uint256 => Loan) private _loans;

    uint256 private _nextLoanId = 1;
    address private _troveManager;

    uint256 private constant ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;
    uint256 private constant MAX_INT = 2 ** 256 - 1;

    event LoanRepayment(uint256 loanId, uint256 interest, uint256 newAmount);
    event NonceUpdated(address owner, uint256 offerId, uint256 nonce);
    event PublishOffer(LoanOffer offer, bytes signature);

    // init and configuration functions
    constructor() ERC721("DepositNFT", "ULD") {}

    function setTroveManager(address troveManager) public {
        // can only be set once
        if (_troveManager == address(0)) {
            _troveManager = troveManager;
        }
    }

    // state changing functions
    function publishOffer(
        LoanOffer calldata offer,
        bytes calldata signature
    ) public {
        emit PublishOffer(offer, signature); //33k gas
    }

    function setOfferNonce(
        uint256 offerId,
        address token,
        uint256 nonce
    ) public {
        _offerNonces[getOfferKey(msg.sender, token, offerId)] = nonce;
        emit NonceUpdated(msg.sender, offerId, nonce);
    }

    function openLoan(
        LoanOffer calldata loanOffer,
        bytes calldata signature,
        uint256 amount,
        uint256 duration,
        address borrower
    ) public returns (uint256) {
        require(
            msg.sender == _troveManager,
            "only trove manager can start loan"
        );
        verifyLoanOfferSignature(loanOffer, signature); //8k gas
        bytes32 key = getOfferKey(
            loanOffer.owner,
            loanOffer.token,
            loanOffer.offerId
        ); // should use hash of message as key instead?

        require(_offerNonces[key] <= loanOffer.nonce, "invalid nonce");

        // check if loan verifies parameters of offer
        require(amount >= loanOffer.minLoanAmount, "amount too small");
        _offerAmountBorrowed[key] += amount; //20k gas
        require(
            loanOffer.amount >= _offerAmountBorrowed[key],
            "not enough funds available"
        );

        require(
            block.timestamp <= loanOffer.expiration,
            "supply expiration reached"
        );
        require(loanOffer.minLoanDuration <= duration, "invalid duration");
        require(duration <= loanOffer.maxLoanDuration, "invalid duration");

        uint256 loanId = _nextLoanId++;
        _loans[loanId] = Loan({
            token: loanOffer.token,
            amount: amount,
            startTime: uint32(block.timestamp),
            minRepayTime: uint32(block.timestamp + loanOffer.minLoanDuration),
            expiration: uint32(block.timestamp + duration),
            interestRateBPS: uint32(loanOffer.interestRateBPS)
        }); // 70k gas

        _safeMint(loanOffer.owner, loanId); // 50k gas

        require(
            ERC20(loanOffer.token).transferFrom( // 25k gas
                loanOffer.owner,
                borrower,
                amount
            ),
            "transfer failed"
        );

        return loanId;
    }

    function getAmountToTransfer() public view {}

    function repayLoan(
        address borrower,
        uint256 loanId,
        uint256 newAmount
    ) public {
        require(
            msg.sender == _troveManager,
            "only trove manager can repay loan"
        );

        Loan storage l = _loans[loanId]; //should the whole thing be loaded?

        uint256 interest = getInterest(
            l.amount,
            l.interestRateBPS,
            block.timestamp - l.startTime
        );

        if (block.timestamp < l.minRepayTime) {
            //early repayment fee
            interest += getInterest(
                l.amount - newAmount,
                l.interestRateBPS,
                l.minRepayTime - block.timestamp
            );
        }
        require(
            newAmount < l.amount + interest,
            "new amount larger or equal to current debt"
        );

        uint256 amountToTransfer = l.amount + interest - newAmount;

        _claimable[loanId] += amountToTransfer;

        l.amount = newAmount;
        l.startTime = uint32(block.timestamp);

        require(
            ERC20(l.token).transferFrom(
                borrower,
                address(this),
                amountToTransfer
            ),
            "interest payment failed"
        );

        emit LoanRepayment(loanId, interest, newAmount);
    }

    function withdraw(uint256 loanId) public {
        require(msg.sender == ownerOf(loanId));

        uint256 claimable = _claimable[loanId];
        _claimable[loanId] = 0;

        require(
            ERC20(_loans[loanId].token).transferFrom(
                address(this),
                ownerOf(loanId),
                claimable
            ),
            "withdraw failed"
        );
    }

    // view functions

    function getOfferInfo(
        bytes32 offerKey
    ) public view returns (uint256, uint256) {
        return (_offerNonces[offerKey], _offerAmountBorrowed[offerKey]);
    }

    function getLoanToken(uint256 loanId) public view returns (address) {
        return (_loans[loanId].token);
    }

    function getLoan(uint256 loanId) public view returns (Loan memory) {
        return _loans[loanId];
    }

    function getLoanAmountAndMinInterest(
        uint256 loanId
    ) public view returns (address, uint256, uint256) {
        uint256 duration = max(block.timestamp, _loans[loanId].minRepayTime) -
            _loans[loanId].startTime;
        return (
            _loans[loanId].token,
            _loans[loanId].amount,
            getInterest(
                _loans[loanId].amount,
                _loans[loanId].interestRateBPS,
                duration
            )
        );
    }

    // helper functions (pure)
    function getInterest(
        uint256 amount,
        uint256 interestRateBPS,
        uint256 duration
    ) private pure returns (uint256) {
        return ((amount * duration * interestRateBPS) /
            (ONE_YEAR_IN_SECONDS * 10000)); // use openzeppelin safemath instead?
    }

    function buildLoanOfferMessage(
        LoanOffer calldata loanOffer
    ) public pure returns (bytes32) {
        return (
            keccak256(
                abi.encodePacked(
                    loanOffer.owner,
                    loanOffer.token,
                    loanOffer.offerId,
                    loanOffer.nonce,
                    loanOffer.minLoanAmount,
                    loanOffer.amount,
                    loanOffer.interestRateBPS,
                    loanOffer.expiration,
                    loanOffer.minLoanDuration,
                    loanOffer.maxLoanDuration
                )
            )
        );
    }

    function verifyLoanOfferSignature(
        LoanOffer calldata loanOffer,
        bytes calldata sig
    ) public pure {
        bytes32 message = prefixed(buildLoanOfferMessage(loanOffer));
        require(
            recoverSigner(message, sig) == loanOffer.owner,
            "invalid signature"
        );
    }

    // is this safe from collisions? could be replaced with mapping -> mapping for nonces and offerLoans.
    function getOfferKey(
        address sender,
        address token,
        uint256 offerId
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(sender, token, offerId));
    }

    function max(uint256 a, uint256 b) private pure returns (uint256) {
        return a >= b ? a : b;
    }

    function min(uint256 a, uint256 b) private pure returns (uint256) {
        return a >= b ? b : a;
    }
}
