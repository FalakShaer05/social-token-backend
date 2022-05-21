//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


//pragma solidity ^0.8.4;

//import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
//import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
//import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";
//import "@openzeppelin/contracts/utils/Counters.sol";

contract SocialNFT is ERC721Enumerable, Ownable {

    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    mapping(uint => uint) orderBook;

    event TokenListed(
        uint indexed _tokenId,
        uint indexed _price
    );
    
    event TokenSold(
        uint indexed _tokenId,
        uint indexed _price
    );

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

    function listToken(uint _tokenId, uint _price) public {
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
    }

 
}