//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Reselve is Ownable {
  IERC20 public immutable token;
  uint256 public unlockTime;
  constructor(address _tokenAddress) {
    token = IERC20(_tokenAddress);
    unlockTime = block.timestamp + 24 weeks;
  }

  modifier checkTimestamp() {
    require(block.timestamp > unlockTime, "Reserve: Can not Trade");
    _;
  }

  function withdrawTo(address _to, uint256 _value) public onlyOwner checkTimestamp {
    require(_to != address(0), "Reserve: transfer to zero address");
    require(token.balanceOf(address(this)) >= _value, "Reserve: exceeds contract balence");
    token.transfer(_to, _value);
    
  } 
}