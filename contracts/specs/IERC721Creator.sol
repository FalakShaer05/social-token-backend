// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IERC721Creator {
    function tokenCreator(uint256 _tokenId)
	external
	view
	returns (address);
}
