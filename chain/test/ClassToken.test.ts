import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, BigNumber } from "ethers"

describe("ClassToken", function () {

  let test:Contract;

  // beforeEach(async function () {
  //   const Box = await ethers.getContractFactory("Box")
  //   box = await Box.deploy()
  //   await box.deployed()
  // })

  it("Should have the correct initial supply", async function () {
    const initialSupply = ethers.utils.parseEther('10000.0')
    const ClassToken = await ethers.getContractFactory("ClassToken");
    const token = await ClassToken.deploy(initialSupply);
    await token.deployed();

    expect(await token.totalSupply()).to.equal(initialSupply);
  });
});