function waitForEnter(callback) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
    process.stdin.setRawMode(false);
        if (callback) callback();
    });
}

module.exports = { waitForEnter };  