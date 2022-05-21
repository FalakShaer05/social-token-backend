//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import 'https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SocialNFT is ERC721Enumerable, Ownable {

    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    event NftBought(address _seller, address _buyer, uint256 _price);

    mapping (uint256 => uint256) public tokenIdToPrice;
    mapping (uint256 => address) public tokenIdToTokenAddress;

    /*mapping(uint => uint) orderBook;

    event TokenListed(
        uint indexed _tokenId,
        uint indexed _price
    );
    
    event TokenSold(
        uint indexed _tokenId,
        uint indexed _price
    );*/

    constructor() ERC721("SocialNFT", "SNT") {}

    function safeMint(address to, string memory uri) public {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function setPrice(uint256 _tokenId, uint256 _price, address _tokenAddress) external {
        require(msg.sender == ownerOf(_tokenId), 'Not owner of this token');
        tokenIdToPrice[_tokenId] = _price;
        tokenIdToTokenAddress[_tokenId] = _tokenAddress;
    }

    function allowBuy(uint256 _tokenId, uint256 _price) external {
        require(msg.sender == ownerOf(_tokenId), 'Not owner of this token');
        require(_price > 0, 'Price zero');
        tokenIdToPrice[_tokenId] = _price;
    }

    function disallowBuy(uint256 _tokenId) external {
        require(msg.sender == ownerOf(_tokenId), 'Not owner of this token');
        tokenIdToPrice[_tokenId] = 0;
    }
    
    function buy(uint256 _tokenId) external payable {
        uint256 price = tokenIdToPrice[_tokenId];
        require(price > 0, 'This token is not for sale');
        require(msg.value == price, 'Incorrect value');
        address seller = ownerOf(_tokenId);
        address tokenAddress = tokenIdToTokenAddress[_tokenId];
        if(address != address(0){
            IERC20 tokenContract = IERC20(tokenAddress);
            require(tokenContract.transferFrom(msg.sender, address(this), price),
                "buy: payment failed");
        } else {
            payable(seller).transfer(msg.value);
        }
        _transfer(seller, msg.sender, _tokenId);
        tokenIdToPrice[_tokenId] = 0;
        

        emit NftBought(seller, msg.sender, msg.value);
    }

    /*function listToken(uint _tokenId, uint _price) public {
        address owner = token.ownerOf(_tokenId);
        require(owner == msg.sender, "caller is not owner");
        require(token.isApprovedForAll(owner, address(this)));

        orderBook[_tokenId] = _price;
        emit TokenListed(_tokenId, _price);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override (ERC721){
      require((msg.sender).balance > phoneBook[tokenId].price);
      super.transferFrom(msg.sender,to,tokenId)
    }


    function approve(
      address to, 
      uint256 tokenId
    ) 
    public 
    virtual 
    override(ERC721)
    {
      super.approve
    }*/

 
}