'use strict';

const authView = document.querySelector('#auth-view');
const bookingView = document.querySelector('#booking-view');
const loginForm = document.querySelector('#login-form');
const resetForm = document.querySelector('#reset-form');
const loginError = document.querySelector('#login-error');
const resetMessage = document.querySelector('#reset-message');
const bookingMessage = document.querySelector('#booking-message');
const booked = new Set();

function showMessage(element, text) {
  element.textContent = text;
  element.hidden = false;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

loginForm.addEventListener('submit', event => {
  event.preventDefault();
  const email = document.querySelector('#email').value.trim();
  const password = document.querySelector('#password').value;
  if (!validEmail(email) || password.length < 6) {
    showMessage(loginError, '이메일 형식과 6자 이상의 비밀번호를 확인해 주세요.');
    return;
  }
  loginError.hidden = true;
  document.querySelector('#account-email').textContent = email;
  authView.hidden = true;
  bookingView.hidden = false;
});

document.querySelector('#forgot-button').addEventListener('click', () => {
  loginForm.hidden = true;
  resetForm.hidden = false;
});

document.querySelector('#back-login').addEventListener('click', () => {
  resetForm.hidden = true;
  loginForm.hidden = false;
});

resetForm.addEventListener('submit', event => {
  event.preventDefault();
  const email = document.querySelector('#reset-email').value.trim();
  resetMessage.className = `message ${validEmail(email) ? 'success' : 'error'}`;
  showMessage(resetMessage, validEmail(email)
    ? '재설정 링크를 보냈어요. 링크는 30분 동안 유효합니다.'
    : '가입할 때 사용한 이메일을 입력해 주세요.');
});

for (const button of document.querySelectorAll('.book-button')) {
  button.addEventListener('click', () => {
    const className = button.dataset.class;
    if (booked.has(className)) return;
    booked.add(className);
    button.textContent = '예약됨';
    button.disabled = true;
    document.querySelector('#booking-count').textContent = `내 예약 ${booked.size}`;
    showMessage(bookingMessage, `${className} 예약이 완료됐어요.`);
  });
}

function input(selector, value) {
  const element = document.querySelector(selector);
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

function submit(form) {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function assertScenario(condition, label) {
  if (!condition) throw new Error(label);
}

function runBrowserScenario(name) {
  try {
    if (name === 'login-book') {
      input('#email', 'member@example.com');
      input('#password', 'routine7');
      submit(loginForm);
      document.querySelector('[data-class="Morning Flow"]').click();
      assertScenario(!bookingView.hidden, 'booking view should be visible');
      assertScenario(document.querySelector('#booking-count').textContent === '내 예약 1', 'booking count');
      assertScenario(bookingMessage.textContent.includes('완료'), 'booking confirmation');
    } else if (name === 'invalid-login') {
      input('#email', 'wrong-email');
      input('#password', '123');
      submit(loginForm);
      assertScenario(!loginError.hidden, 'validation error should be visible');
      assertScenario(bookingView.hidden, 'booking view should stay hidden');
    } else if (name === 'password-reset') {
      document.querySelector('#forgot-button').click();
      input('#reset-email', 'member@example.com');
      submit(resetForm);
      assertScenario(resetMessage.textContent.includes('30분'), 'reset expiry guidance');
    } else if (name !== 'initial') {
      throw new Error(`unknown scenario: ${name}`);
    }
    document.documentElement.dataset.qaScenario = name;
    document.documentElement.dataset.qaStatus = 'passed';
  } catch (error) {
    document.documentElement.dataset.qaScenario = name;
    document.documentElement.dataset.qaStatus = 'failed';
    document.documentElement.dataset.qaError = error.message;
  }
}

const qaScenario = new URLSearchParams(window.location.search).get('qa');
if (qaScenario) window.addEventListener('load', () => runBrowserScenario(qaScenario));
