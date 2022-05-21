// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "openzeppelin-contracts-upgradeable/contracts/utils/AddressUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/contracts/utils/introspection/ERC165Upgradeable.sol";
import "openzeppelin-contracts-upgradeable/contracts/access/IAccessControlUpgradeable.sol";

import "openzeppelin-contracts/contracts/utils/introspection/ERC165Checker.sol";

import "./ICreatorRegistry.sol";
import "./specs/IAdminControl.sol";

contract CreatorRegistry is OwnableUpgradeable, ERC165Upgradeable, ICreatorRegistry {
    using AddressUpgradeable for address;

    mapping(address => address) private _overrides;

    function initialize() public initializer {
		__Ownable_init();
		__ERC165_init();
    }

    function supportsInterface(bytes4 _interfaceId)
		public
		view
		virtual
		override
		returns (bool)
    {
		return _interfaceId == type(ICreatorRegistry).interfaceId || ERC165Upgradeable.supportsInterface(_interfaceId);
    }

    function setCreatorLookupAddress(address _tokenContract, address _creatorLookup)
		external
		override
    {
		if (!_tokenContract.isContract() || (!_creatorLookup.isContract() && _creatorLookup != address(0))) {
		    revert InvalidCreatorOverride(_tokenContract, _creatorLookup);
		}
		if (!senderCanOverride(_tokenContract)) revert Unauthorized();
		_overrides[_tokenContract] = _creatorLookup;
		emit CreatorRegistryOverride(_msgSender(), _tokenContract, _creatorLookup);
    }

    function getCreatorLookupAddress(address _tokenContract)
		external
		view
		override
		returns (address)
    {
		return _overrides[_tokenContract] == address(0) ? _tokenContract : _overrides[_tokenContract];
    }

    function senderCanOverride(address _tokenContract)
		public
		view
		override
		returns (bool)
    {
		if (owner() == _msgSender()) return true;
	
		try OwnableUpgradeable(_tokenContract).owner() returns (address owner) {
		    return owner == _msgSender();
		} catch {}
	
		if (ERC165Checker.supportsInterface(_tokenContract, type(IAdminControl).interfaceId)
			&& IAdminControl(_tokenContract).isAdmin(_msgSender())) {
			return true;
		}
	
		try IAccessControlUpgradeable(_tokenContract).hasRole(0x00, _msgSender()) returns (bool hasRole) {
			if (hasRole) return true;
		} catch {}
	
		return false;
    }
}
