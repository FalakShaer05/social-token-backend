// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "openzeppelin-contracts-upgradeable/contracts/utils/introspection/ERC165Upgradeable.sol";
import "openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/contracts/utils/AddressUpgradeable.sol";

import "openzeppelin-contracts/contracts/utils/introspection/ERC165Checker.sol";

import "./ICreatorEngine.sol";
import "./ICreatorRegistry.sol";
import "./specs/IERC721Creator.sol";

contract CreatorEngine is OwnableUpgradeable, ERC165Upgradeable, ICreatorEngine {
    using AddressUpgradeable for address;

    int16 constant private NONE = -1;
    int16 constant private NOT_CONFIGURED = 0;
    int16 constant private SUPERRARE = 1;
    int16 constant private OWNABLE = 2;

    mapping(address => int16) private _specCache;

    ICreatorRegistry public creatorRegistry;
    
    function initialize(address _creatorRegistry) public initializer {
	__Ownable_init();
	require(ERC165Checker.supportsInterface(_creatorRegistry, type(ICreatorRegistry).interfaceId));
	creatorRegistry = ICreatorRegistry(_creatorRegistry);
    }

    function supportsInterface(bytes4 _interfaceId)
        public
	view
	virtual
	override
	returns (bool)
    {
	return _interfaceId == type(ICreatorEngine).interfaceId || ERC165Upgradeable.supportsInterface(_interfaceId);
    }

    function getCreatorView(address _contractAddress, uint256 _tokenId)
	external
	view
	override
	returns (address payable)
    {
	(, address creator, ,) = _getCreatorAndSpec(_contractAddress, _tokenId);
	return payable(creator);
    }

    function getCreator(address _contractAddress, uint256 _tokenId)
	external
	override
	returns (address payable)
    {
	(address creatorRegistryAddress, address creator, int16 spec, bool addToCache) = _getCreatorAndSpec(_contractAddress, _tokenId);
	if (addToCache) _specCache[creatorRegistryAddress] = spec;
	return payable(creator);
    }

    function getCachedSpecForAddress(address _contractAddress)
	public
	view
	returns (int16)
    {
	address creatorRegistryAddress = creatorRegistry.getCreatorLookupAddress(_contractAddress);
	return _specCache[creatorRegistryAddress];
    }

    function evictCacheForAddress(address _contractAddress)
	external
    {
	address	creatorRegistryAddress = creatorRegistry.getCreatorLookupAddress(_contractAddress);
	delete _specCache[creatorRegistryAddress];
    }

    function _getCreatorAndSpec(address _contractAddress, uint256 _tokenId)
	internal
	view
	returns (address creatorRegistryAddress, address creator, int16 spec, bool addToCache)
    {
	creatorRegistryAddress = creatorRegistry.getCreatorLookupAddress(_contractAddress);
	spec = _specCache[creatorRegistryAddress];

	if (spec <= NOT_CONFIGURED && spec > NONE) {
	    addToCache = true;
	    
	    try IERC721Creator(creatorRegistryAddress).tokenCreator(_tokenId) returns(address tokenCreator) {
		return (creatorRegistryAddress, tokenCreator, SUPERRARE, addToCache);
	    } catch {}

	    try OwnableUpgradeable(creatorRegistryAddress).owner() returns(address owner) {
		return (creatorRegistryAddress, owner, OWNABLE, addToCache);
	    } catch {}

	    return (creatorRegistryAddress, creator, NONE, addToCache);
	} else {
	    addToCache = false;

	    if (spec == NONE) {
		return (creatorRegistryAddress, creator, NONE, addToCache);
	    } else if (spec == SUPERRARE) {
		creator = IERC721Creator(creatorRegistryAddress).tokenCreator(_tokenId);
		return (creatorRegistryAddress, creator, SUPERRARE, addToCache);
	    } else if (spec == OWNABLE) {
		creator = OwnableUpgradeable(creatorRegistryAddress).owner();
		return (creatorRegistryAddress, creator, OWNABLE, addToCache);
	    }
	}
    }
}
