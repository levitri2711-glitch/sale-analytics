// API_URL: máy chủ Apps Script (…/exec). Chạy thử trên máy (localhost) thì dùng '/api' của dev_server.
window.APP_CONFIG = {
  API_URL: /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? '/api' : 'https://script.google.com/macros/s/AKfycbwKjgTiYJxgZWInDFYUVfsvXU_TeCMdE5DZHCPG9SbWoSwJz8979kh5UDd0mOwFVNY/exec',
  APP_NAME: 'Sale Analytics',
};
