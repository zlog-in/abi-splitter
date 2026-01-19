// Constants for integer bounds
const MAX_INT128 = BigInt('0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
const INT128_MODULO = BigInt(1) << BigInt(128);

function splitHexString() {
    const input = document.getElementById('hexInput').value.trim();
    const outputSection = document.getElementById('outputSection');
    const outputContainer = document.getElementById('output');
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');

    // Clear previous output and errors
    outputContainer.innerHTML = '';
    errorSection.style.display = 'none';
    outputSection.style.display = 'none';

    // Validate input
    if (!input) {
        showError('Please enter a hex string');
        return;
    }

    // Remove 0x prefix if present
    let hexString = input.startsWith('0x') || input.startsWith('0X') 
        ? input.slice(2) 
        : input;

    // Remove whitespace and newlines
    hexString = hexString.replace(/\s/g, '');

    // Validate hex string
    if (!/^[0-9a-fA-F]*$/.test(hexString)) {
        showError('Invalid hex string. Only hexadecimal characters (0-9, a-f, A-F) are allowed');
        return;
    }

    if (hexString.length === 0) {
        showError('Hex string is empty');
        return;
    }

    // Split into bytes32 blocks (64 characters each = 32 bytes)
    const blockSize = 64;
    const blocks = [];
    
    for (let i = 0; i < hexString.length; i += blockSize) {
        const block = hexString.slice(i, i + blockSize);
        blocks.push(block);
    }

    // Display blocks
    if (blocks.length > 0) {
        outputSection.style.display = 'block';
        
        blocks.forEach((block, index) => {
            const blockDiv = document.createElement('div');
            blockDiv.className = 'block';
            
            const blockHeader = document.createElement('div');
            blockHeader.className = 'block-header';
            blockHeader.textContent = `Block ${index} (${block.length} chars${block.length < blockSize ? ' - partial' : ''})`;
            
            const blockContent = document.createElement('div');
            blockContent.className = 'block-content';
            blockContent.textContent = '0x' + block;
            
            blockDiv.appendChild(blockHeader);
            blockDiv.appendChild(blockContent);
            
            // Add decode options only for complete blocks (64 chars)
            if (block.length === blockSize) {
                const decodeSection = document.createElement('div');
                decodeSection.className = 'decode-section';
                
                const decodeLabel = document.createElement('label');
                decodeLabel.textContent = 'Decode as: ';
                decodeLabel.className = 'decode-label';
                
                const decodeSelect = document.createElement('select');
                decodeSelect.className = 'decode-select';
                decodeSelect.innerHTML = `
                    <option value="">Select type...</option>
                    <option value="bytes32">bytes32</option>
                    <option value="address">address</option>
                    <option value="uint256">uint256</option>
                    <option value="uint128">uint128</option>
                    <option value="int128">int128</option>
                    <option value="uint64">uint64</option>
                `;
                
                const decodeResult = document.createElement('div');
                decodeResult.className = 'decode-result';
                decodeResult.style.display = 'none';
                
                decodeSelect.addEventListener('change', function() {
                    const selectedType = this.value;
                    if (selectedType) {
                        const decoded = decodeBlock(block, selectedType);
                        decodeResult.textContent = decoded;
                        decodeResult.style.display = 'block';
                    } else {
                        decodeResult.style.display = 'none';
                    }
                });
                
                decodeSection.appendChild(decodeLabel);
                decodeSection.appendChild(decodeSelect);
                decodeSection.appendChild(decodeResult);
                blockDiv.appendChild(decodeSection);
            }
            
            outputContainer.appendChild(blockDiv);
        });
    }
}

function showError(message) {
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
}

function decodeBlock(hexBlock, type) {
    // Ensure we have a 64-character hex string (32 bytes)
    // Left-pad with zeros if needed (though this should always be 64 chars when called)
    const paddedBlock = hexBlock.padStart(64, '0');
    
    try {
        switch(type) {
            case 'bytes32':
                // Return as is, already bytes32
                return '0x' + paddedBlock;
            
            case 'address':
                // Address is the last 20 bytes (40 hex chars) of the 32-byte block
                // In ABI encoding, addresses are padded with zeros on the left
                const address = paddedBlock.slice(-40);
                return '0x' + address;
            
            case 'uint256':
                // Convert hex to decimal for uint256
                return hexToUint256(paddedBlock);
            
            case 'uint128':
                // Take the last 16 bytes (32 hex chars) for uint128
                const uint128Hex = paddedBlock.slice(-32);
                return hexToUint(uint128Hex);
            
            case 'int128':
                // Take the last 16 bytes (32 hex chars) for int128
                const int128Hex = paddedBlock.slice(-32);
                return hexToInt128(int128Hex);
            
            case 'uint64':
                // Take the last 8 bytes (16 hex chars) for uint64
                const uint64Hex = paddedBlock.slice(-16);
                return hexToUint(uint64Hex);
            
            default:
                return 'Unknown type';
        }
    } catch (error) {
        return 'Error decoding: ' + error.message;
    }
}

function hexToUint256(hex) {
    // Handle large numbers using BigInt
    try {
        const bigIntValue = BigInt('0x' + hex);
        return bigIntValue.toString();
    } catch (e) {
        return 'Error: Invalid hex for uint256';
    }
}

function hexToUint(hex) {
    try {
        const bigIntValue = BigInt('0x' + hex);
        return bigIntValue.toString();
    } catch (e) {
        return 'Error: Invalid hex';
    }
}

function hexToInt128(hex) {
    try {
        const bigIntValue = BigInt('0x' + hex);
        // Check if the sign bit is set (for 128-bit signed integer)
        if (bigIntValue > MAX_INT128) {
            // Negative number in two's complement
            const negativeValue = bigIntValue - INT128_MODULO;
            return negativeValue.toString();
        }
        return bigIntValue.toString();
    } catch (e) {
        return 'Error: Invalid hex for int128';
    }
}

function clearAll() {
    document.getElementById('hexInput').value = '';
    document.getElementById('output').innerHTML = '';
    document.getElementById('outputSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
}

// Allow Ctrl/Cmd+Enter to trigger split while preserving normal Enter for line breaks in textarea
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('hexInput').addEventListener('keydown', function(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            splitHexString();
        }
    });
});
