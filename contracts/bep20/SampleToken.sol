//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.17;

import "./IERC20.sol";

contract SampleToken is IERC20 {
  
  constructor()  {
    _totalSupply = 1000000;
    _balances[msg.sender] = 1000000;

  }
  uint256 private _totalSupply;
  mapping(address => uint256) private  _balances;
  mapping(address => mapping(address => uint256)) private _allowances;

  function totalSupply() public view override returns(uint256) {
    return _totalSupply;
  }
  function balanceOf(address  account) public view override returns(uint256) {
    return _balances[account];
  }
  function transfer(address recipient, uint256 amount) public override returns(bool) {
    require(_balances[msg.sender] >= amount);
    _balances[msg.sender] -= amount;
    _balances[ recipient] += amount;

    emit Transfer(msg.sender, recipient, amount);
    return true;

  }
  function transferFrom(address sender,  address recipient, uint256  amount) public override returns(bool) {
    require(_balances[sender] >= amount);
    require(_allowances[sender][msg.sender] >= amount);
    _balances[sender] -= amount;
    _balances[recipient] += amount;

    emit  Transfer(sender, recipient, amount);
    return true;
  }
  function approve(address recipient, uint256 amount) public override returns(bool){
    _allowances[msg.sender][recipient] = amount;

    emit Approval(msg.sender, recipient, amount);
    return true;
  }

  function allowance(address owner, address spender) public view  override returns(uint256) {
    return _allowances[owner][spender];
  }
}