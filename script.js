// Constants for integer bounds
const MAX_INT128 = BigInt('0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
const INT128_MODULO = BigInt(1) << BigInt(128);

// Store current blocks for auto-decoding
let currentBlocks = [];
let currentCalldataMode = false;

function splitHexString() {
    const input = document.getElementById('hexInput').value.trim();
    const outputSection = document.getElementById('outputSection');
    const outputContainer = document.getElementById('output');
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    const selectorSection = document.getElementById('selectorSection');
    const calldataMode = document.getElementById('calldataMode').checked;

    // Clear previous output and errors
    outputContainer.innerHTML = '';
    errorSection.style.display = 'none';
    outputSection.style.display = 'none';
    selectorSection.style.display = 'none';

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

    // Handle calldata mode - extract function selector
    let functionSelector = null;
    if (calldataMode && hexString.length >= 8) {
        functionSelector = hexString.slice(0, 8);
        hexString = hexString.slice(8);
    } else if (calldataMode && hexString.length > 0 && hexString.length < 8) {
        showError('Calldata too short. Need at least 4 bytes (8 hex chars) for function selector');
        return;
    }

    // Split into bytes32 blocks (64 characters each = 32 bytes)
    const blockSize = 64;
    const blocks = [];

    for (let i = 0; i < hexString.length; i += blockSize) {
        const block = hexString.slice(i, i + blockSize);
        blocks.push(block);
    }

    // Store blocks for auto-decoding
    currentBlocks = blocks;
    currentCalldataMode = calldataMode;

    // Display function selector if in calldata mode
    if (functionSelector) {
        displayFunctionSelector(functionSelector, blocks);
    }

    // Display blocks
    if (blocks.length > 0 || functionSelector) {
        outputSection.style.display = 'block';

        blocks.forEach((block, index) => {
            const blockDiv = document.createElement('div');
            blockDiv.className = 'block';

            const blockHeader = document.createElement('div');
            blockHeader.className = 'block-header';

            // Show offset info in calldata mode
            if (calldataMode) {
                const offset = index * 32;
                blockHeader.textContent = `Block ${index} - Offset 0x${offset.toString(16).padStart(2, '0')} (${block.length} chars${block.length < blockSize ? ' - partial' : ''})`;
            } else {
                blockHeader.textContent = `Block ${index} (${block.length} chars${block.length < blockSize ? ' - partial' : ''})`;
            }

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

function displayFunctionSelector(selector, blocks) {
    const selectorSection = document.getElementById('selectorSection');
    const selectorValue = document.getElementById('selectorValue');
    const selectorLookup = document.getElementById('selectorLookup');
    const signatureSection = document.getElementById('signatureSection');
    const signatureLoading = document.getElementById('signatureLoading');
    const signatureResult = document.getElementById('signatureResult');

    selectorValue.textContent = '0x' + selector;
    selectorLookup.href = `https://www.4byte.directory/signatures/?bytes4_signature=0x${selector}`;
    selectorSection.style.display = 'block';

    // Show loading state and fetch signature from 4byte.directory
    signatureSection.style.display = 'block';
    signatureLoading.style.display = 'inline';
    signatureResult.style.display = 'none';

    fetchFunctionSignature(selector, blocks);
}

async function fetchFunctionSignature(selector, blocks) {
    const signatureLoading = document.getElementById('signatureLoading');
    const signatureResult = document.getElementById('signatureResult');

    try {
        const response = await fetch(`https://www.4byte.directory/api/v1/signatures/?hex_signature=0x${selector}`);
        const data = await response.json();

        signatureLoading.style.display = 'none';

        if (data.results && data.results.length > 0) {
            // Sort by ID (lower ID = more common/older signature)
            const sortedResults = data.results.sort((a, b) => a.id - b.id);
            const signatures = sortedResults.map(r => r.text_signature);

            // Display all possible signatures
            signatureResult.innerHTML = '';

            if (signatures.length === 1) {
                const sigDiv = createSignatureElement(signatures[0], blocks, true);
                signatureResult.appendChild(sigDiv);
            } else {
                // Multiple signatures - let user select
                const selectLabel = document.createElement('div');
                selectLabel.className = 'signature-select-label';
                selectLabel.textContent = `Found ${signatures.length} possible signatures:`;
                signatureResult.appendChild(selectLabel);

                const select = document.createElement('select');
                select.className = 'signature-select';
                signatures.forEach((sig, idx) => {
                    const option = document.createElement('option');
                    option.value = idx;
                    option.textContent = sig;
                    select.appendChild(option);
                });

                const sigDisplay = document.createElement('div');
                sigDisplay.className = 'signature-display';

                select.addEventListener('change', function() {
                    sigDisplay.innerHTML = '';
                    const sigDiv = createSignatureElement(signatures[this.value], blocks, true);
                    sigDisplay.appendChild(sigDiv);
                });

                signatureResult.appendChild(select);
                signatureResult.appendChild(sigDisplay);

                // Auto-select first option
                const firstSigDiv = createSignatureElement(signatures[0], blocks, true);
                sigDisplay.appendChild(firstSigDiv);
            }

            signatureResult.style.display = 'block';
        } else {
            signatureResult.innerHTML = '<span class="signature-not-found">Signature not found in 4byte.directory</span>';
            signatureResult.style.display = 'block';
        }
    } catch (error) {
        signatureLoading.style.display = 'none';
        signatureResult.innerHTML = `<span class="signature-error">Failed to fetch signature: ${error.message}</span>`;
        signatureResult.style.display = 'block';
    }
}

function createSignatureElement(signature, blocks, autoDecodeBlocks) {
    const container = document.createElement('div');
    container.className = 'signature-container';

    // Parse and display the signature with syntax highlighting
    const funcName = signature.match(/^([^(]+)/)?.[1] || '';
    const paramTypes = parseSignatureTypes(signature);

    const sigSpan = document.createElement('div');
    sigSpan.className = 'signature-formatted';
    sigSpan.innerHTML = `<span class="sig-func-name">${funcName}</span>(<span class="sig-params">${paramTypes.join(', ')}</span>)`;
    container.appendChild(sigSpan);

    // Decode and display parameters
    if (paramTypes.length > 0 && blocks.length > 0) {
        const paramsDiv = document.createElement('div');
        paramsDiv.className = 'decoded-params';

        paramTypes.forEach((paramType, index) => {
            const paramRow = document.createElement('div');
            paramRow.className = 'decoded-param-row';

            const paramIndex = document.createElement('span');
            paramIndex.className = 'param-index';
            paramIndex.textContent = `[${index}]`;

            const paramTypeSpan = document.createElement('span');
            paramTypeSpan.className = 'param-type';
            paramTypeSpan.textContent = paramType;

            const paramArrow = document.createElement('span');
            paramArrow.className = 'param-arrow';
            paramArrow.textContent = '→';

            const paramValue = document.createElement('span');
            paramValue.className = 'param-value';

            if (index < blocks.length) {
                const block = blocks[index];
                const decodedValue = decodeParamValue(block, paramType);
                paramValue.textContent = decodedValue;
                if (decodedValue.startsWith('0x')) {
                    paramValue.classList.add('param-value-hex');
                }
            } else {
                paramValue.textContent = '(no data)';
                paramValue.classList.add('param-value-missing');
            }

            paramRow.appendChild(paramIndex);
            paramRow.appendChild(paramTypeSpan);
            paramRow.appendChild(paramArrow);
            paramRow.appendChild(paramValue);
            paramsDiv.appendChild(paramRow);
        });

        container.appendChild(paramsDiv);
    }

    // Also update block headers with type hints
    if (autoDecodeBlocks && paramTypes.length > 0) {
        applyAutoDecoding(paramTypes);
    }

    return container;
}

function decodeParamValue(hexBlock, paramType) {
    const paddedBlock = hexBlock.padStart(64, '0');
    const type = paramType.toLowerCase().trim();

    try {
        // Address
        if (type === 'address') {
            return '0x' + paddedBlock.slice(-40);
        }

        // Boolean
        if (type === 'bool') {
            const val = BigInt('0x' + paddedBlock);
            return val === BigInt(0) ? 'false' : 'true';
        }

        // Bytes32 and fixed bytes
        if (type === 'bytes32') {
            return '0x' + paddedBlock;
        }
        if (/^bytes(\d+)$/.test(type)) {
            const size = parseInt(type.replace('bytes', ''));
            return '0x' + paddedBlock.slice(0, size * 2);
        }

        // Dynamic types - show as pointer
        if (type === 'bytes' || type === 'string' || type.includes('[') || type.includes('(')) {
            const offset = BigInt('0x' + paddedBlock);
            return `offset: ${offset} (dynamic)`;
        }

        // Signed integers
        if (/^int(\d*)$/.test(type)) {
            const bits = parseInt(type.replace('int', '') || '256');
            const val = BigInt('0x' + paddedBlock);
            const maxPositive = (BigInt(1) << BigInt(bits - 1)) - BigInt(1);
            const modulo = BigInt(1) << BigInt(bits);
            if (val > maxPositive) {
                return (val - modulo).toString();
            }
            return val.toString();
        }

        // Unsigned integers
        if (/^uint(\d*)$/.test(type)) {
            const val = BigInt('0x' + paddedBlock);
            return val.toString();
        }

        // Default - show as hex
        return '0x' + paddedBlock;
    } catch (e) {
        return '0x' + paddedBlock;
    }
}

function parseSignatureTypes(signature) {
    // Extract parameter types from signature like "transfer(address,uint256)"
    const match = signature.match(/\(([^)]*)\)/);
    if (!match || !match[1]) return [];

    const paramsStr = match[1];
    if (!paramsStr.trim()) return [];

    // Handle nested tuples and arrays by tracking depth
    const types = [];
    let current = '';
    let depth = 0;

    for (const char of paramsStr) {
        if (char === '(' || char === '[') {
            depth++;
            current += char;
        } else if (char === ')' || char === ']') {
            depth--;
            current += char;
        } else if (char === ',' && depth === 0) {
            types.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        types.push(current.trim());
    }

    return types;
}

function mapAbiTypeToDecodeType(abiType) {
    // Normalize the type for matching
    const type = abiType.toLowerCase().trim();

    // Handle arrays - for now just show as bytes32
    if (type.includes('[')) return null;

    // Handle tuples - for now just show as bytes32
    if (type.includes('(')) return null;

    // Address type
    if (type === 'address') return 'address';

    // Boolean - stored as uint8 in ABI
    if (type === 'bool') return 'uint256';

    // Bytes32 and fixed bytes
    if (type === 'bytes32') return 'bytes32';
    if (/^bytes\d+$/.test(type)) return 'bytes32';

    // Dynamic bytes and string - these are pointers, not directly decodable
    if (type === 'bytes' || type === 'string') return null;

    // Signed integers
    if (/^int\d*$/.test(type)) {
        const bits = parseInt(type.replace('int', '') || '256');
        if (bits <= 128) return 'int128';
        return 'uint256'; // Show as raw value
    }

    // Unsigned integers
    if (/^uint\d*$/.test(type)) {
        const bits = parseInt(type.replace('uint', '') || '256');
        if (bits <= 64) return 'uint64';
        if (bits <= 128) return 'uint128';
        return 'uint256';
    }

    return null;
}

function applyAutoDecoding(paramTypes) {
    const outputContainer = document.getElementById('output');
    const blockDivs = outputContainer.querySelectorAll('.block');

    paramTypes.forEach((paramType, index) => {
        if (index >= blockDivs.length) return;

        const blockDiv = blockDivs[index];
        const decodeSelect = blockDiv.querySelector('.decode-select');
        if (!decodeSelect) return;

        const decodeType = mapAbiTypeToDecodeType(paramType);
        if (decodeType) {
            // Set the select value and trigger change event
            decodeSelect.value = decodeType;
            decodeSelect.dispatchEvent(new Event('change'));

            // Update the block header to show the parameter type
            const blockHeader = blockDiv.querySelector('.block-header');
            if (blockHeader && currentCalldataMode) {
                const currentText = blockHeader.textContent;
                blockHeader.innerHTML = `${currentText} <span class="param-type-hint">${paramType}</span>`;
            }
        } else {
            // For complex types, just show the type hint
            const blockHeader = blockDiv.querySelector('.block-header');
            if (blockHeader && currentCalldataMode) {
                const currentText = blockHeader.textContent;
                blockHeader.innerHTML = `${currentText} <span class="param-type-hint">${paramType}</span>`;
            }
        }
    });
}

function clearAll() {
    document.getElementById('hexInput').value = '';
    document.getElementById('output').innerHTML = '';
    document.getElementById('outputSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
    document.getElementById('selectorSection').style.display = 'none';
    document.getElementById('calldataMode').checked = false;
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
