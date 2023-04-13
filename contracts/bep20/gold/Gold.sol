//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Gold is ERC20, Pausable, AccessControl {
  bytes32 public constant  PAUSED_ROLE =  keccak256("PAUSED_ROLE");
  mapping(address => bool) private _blackList;
  event BlacklistAdded(address account);
  event BlacklistRemoved(address account);

  constructor() ERC20("GOLD","GLD") {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(PAUSED_ROLE, msg.sender);
    _mint(msg.sender, 1000000000 * 10 ** decimals());
  }

  function pause() public onlyRole(PAUSED_ROLE) {
    _pause();
  }
  function unpause()  public onlyRole(PAUSED_ROLE) {
    _unpause();
  }

  function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
      require(_blackList[from] == false, "Gold: account sender was on blacklist");
      require(_blackList[to] == false, "Gold: account receiver was on blacklist");
      super._beforeTokenTransfer(from, to,  amount);
    }

    function  addToBlacklist(address _account) external onlyRole(DEFAULT_ADMIN_ROLE) {
      require(_account  !=  msg.sender, "Gold: must not add sender  to  blacklist");
      require(_blackList[_account] == false, "Gold account was on blacklist");
      _blackList[_account] = true;
      emit BlacklistAdded(_account);
    }

    function removeFromBlackList(address _account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_blackList[_account] == true, "Gold account was not on blacklist");
        _blackList[_account] = false;
        emit BlacklistRemoved(_account);
    }
}