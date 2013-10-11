var close = document.getElementById('close');
close.addEventListener('click', function() {
    self.port.emit('close', null);
});
self.port.on('change', function(text) {
    document.getElementById('text').textContent = text;
});
