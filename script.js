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

function clearAll() {
    document.getElementById('hexInput').value = '';
    document.getElementById('output').innerHTML = '';
    document.getElementById('outputSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
}

// Allow Enter key to trigger split (with Ctrl/Cmd modifier to avoid interfering with line breaks)
document.getElementById('hexInput').addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        splitHexString();
    }
});
