// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

interface ICreatorRegistry {
    
    event CreatorRegistryOverride(
	address indexed _owner,
	address indexed _tokenContract,
        address indexed _creatorRegistry
    );

    error InvalidCreatorOverride(address _tokenContract, address _creatorLookup);

    error Unauthorized();

    function setCreatorLookupAddress(address _tokenContract, address _creatorLookup)
	external;

    function getCreatorLookupAddress(address _tokenContract)
	external
	view
	returns (address);

    function senderCanOverride(address _tokenContract)
	external
	view
	returns (bool);
}
