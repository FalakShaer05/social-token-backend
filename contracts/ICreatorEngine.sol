// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface ICreatorEngine {
    function getCreatorView(address _contractAddress, uint256 _tokenId)
	external
	view
	returns (address payable);

    function getCreator(address _contractAddress, uint256 _tokenId)
	external
	returns (address payable);
}
