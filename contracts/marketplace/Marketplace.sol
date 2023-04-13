//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Marketplace is Ownable {
  using Counters for Counters.Counter;
  using EnumerableSet for EnumerableSet.AddressSet;

  struct Order {
    address seller; // address nguoi nhan
    address buyer; //adrress nguoi mua ban dau thif 0x000
    uint256 tokenId; // token ban
    address paymentToken; // thanh toan bang nhieu token khac nhau
    uint256 price;

  }

  Counters.Counter private _orderIdCount;
  IERC721 public immutable nftContract; // tuong tu nhu constan nhưng có thẻ lúc them khi bien dịch contract
  mapping(uint256 => Order) orders;
  uint256 public feeDecimal;
  uint256 public feeRate;
  address public feeRecipient; // address nhan chi phi giao dich
  EnumerableSet.AddressSet private _supportedPaymentTokens;

  event OrderAdded(
    uint256 indexed orderId,
    address indexed seller,
    uint indexed tokenId,
    address paymentToken,
    uint256 price
  );

  event OrderCancelled(
    uint256 indexed orderId
  );

  event OrderMatched(
    uint256 indexed orderId,
    address indexed seller,
    address indexed buyer,
    uint256 tokenId,
    address paymentToken,
    uint256 price
  );

  event FeeRateUpdated(
    uint256 feeDecimal,
    uint256 feeRate
  );

  constructor(
    address nftAddress_,
    uint256 feeDecimal_,
    uint256  feeRate_,
    address feeRecipient_
  ) {
      require(
        nftAddress_ != address(0),
        "NFTMarketplace: nftAddress_is zero address"
      );

      require(
        feeRecipient_ != address(0),
        "NFTMarketplace: feeRecipient_ is zero address"
      );
      nftContract = IERC721(nftAddress_);
      feeRecipient = feeRecipient_;
      feeDecimal = feeDecimal_;
      feeRate = feeRate_;
      _orderIdCount.increment();
  }

  function _updateFeecipient(address feeRecipient_) internal {
    require(feeRecipient_  != address(0), "NFTMarketplace: feeRecipient_ is zero address");
      feeRecipient = feeRecipient_;
  }

  function updateFeeRecipient(address feeRecipient_) external onlyOwner {
    _updateFeecipient(feeRecipient_);
  }

  function _updateFeeRate(uint256 feeDecimal_, uint256 feeRate_) internal {
    require(
      feeRate_ <  10**(feeDecimal_ + 2),"NFTMarketplace: bad fee rate"
    );
    feeDecimal = feeDecimal_;
    feeRate = feeRate_;

    emit FeeRateUpdated(feeDecimal_, feeRate_);
  }

  function updateFeeRate(uint256 feeDecimal_, uint256 feeRate_) external onlyOwner {
    _updateFeeRate(feeDecimal_, feeRate_);
  }

  function _calculateFee(uint256 orderId_) private view returns (uint256) {
      //khi toa 1 instance cua struct thi phai de  storage
      Order storage _order = orders[orderId_];
      if(feeRate == 0) {
        return 0;
      } 
      return (feeRate* _order.price) / 10**(feeDecimal + 2);
  }

  function isSeller(uint256 orderId_, address seller_) public view returns(bool) {
    return orders[orderId_].seller == seller_;
  }

  function addPaymentToken(address paymentToken_) external onlyOwner {
    require(paymentToken_ !=  address(0), "NFTMarketplace: feeRecipient_ is zero address");
    require(_supportedPaymentTokens.add(paymentToken_), "NFTMarketplace: already supported");

  }
  //check token Address da duoc support hay chua

  function isPaymentTokenSupported(address paymentToken_) public view returns(bool) {
    return _supportedPaymentTokens.contains(paymentToken_);
  }

  modifier onlySupportedPaymentToken(address paymentToken_) {
    require(isPaymentTokenSupported(paymentToken_), "NFTMarketplace: unsupport payment token");
    _;
  }

  function addOrder(
    uint256 tokenId_,
    address paymentToken_,
    uint256 price_
  ) public onlySupportedPaymentToken(paymentToken_) {
    // nguoi goi ko phai la chu NFT
    require(nftContract.ownerOf(tokenId_) == _msgSender(), "NFTMarketplace: sender is not owner of token");
    require(nftContract.isApprovedForAll(_msgSender(), address(this)), "NFTMarketplace: The contract is unauthorized to manage this token");
    require(price_ > 0, "NFTMarketplace: price must be greater than 0");
    uint256 _orderId = _orderIdCount.current();

    orders[_orderId] = Order(
      _msgSender(),
      address(0),
      tokenId_,
      paymentToken_,
      price_
    );

    _orderIdCount.increment();

  nftContract.transferFrom(_msgSender(), address(this), tokenId_);
  emit OrderAdded(_orderId, _msgSender(), tokenId_, paymentToken_, price_);
  
  }

  function cancelOrder(uint256 orderId_) external {
    Order storage _order = orders[orderId_];
    require(_order.buyer == address(0), "NFTMarketplace: buyer must be zero"); //co nghia la chua ai mua cai nay
    require(_order.seller == _msgSender(), "NFTMarketplace: must be owner");
    uint256 _tokenId = _order.tokenId;
    delete orders[orderId_]; //xoa thong tin tioken trong order
    nftContract.transferFrom(address(this), _msgSender(), _tokenId);
    emit OrderCancelled(orderId_);
  }

  function executeOrder(uint256 orderId_) external {
      Order storage _order = orders[orderId_];
      //order khong ton tai
    require(_order.price > 0, "NFTMarketplace: order has been canceled");
    
    require(!isSeller(orderId_, _msgSender()), "NFTMarketplace: buyer must be different from seller");
    //order chua duoc ban
     require(orders[orderId_].buyer == address(0),"NFTMarketplace: buyer must be zero");
    _order.buyer = _msgSender();
    uint256 _feeAmount =  _calculateFee(orderId_);
    //chuyen phi giao dich cho feeRecipient
    if(_feeAmount > 0) {
      IERC20(_order.paymentToken).transferFrom(_msgSender(), feeRecipient, _feeAmount);
    }
  //chuyen tien cho nguoi ban
    IERC20(_order.paymentToken).transferFrom(_msgSender(), _order.seller, _order.price - _feeAmount);

    nftContract.transferFrom(address(this), _msgSender(), _order.tokenId);

    emit OrderMatched(orderId_, _order.seller, _order.buyer, _order.tokenId, _order.paymentToken, _order.price);

    
    }

}