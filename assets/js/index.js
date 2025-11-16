//前期後期切り替え
const btnEarly = document.querySelector('#btn-early');
const btnLate = document.querySelector('#btn-late');
const early = document.querySelector('#early');
const late = document.querySelector('#late');

btnEarly.addEventListener('click', () => {
  if (btnEarly.classList.contains('active')) {
    return false;
  }

  btnEarly.classList.add('active');
  btnLate.classList.remove('active');
  early.dataset.show = 'on';
  late.dataset.show = 'off';
});

btnLate.addEventListener('click', () => {
  if (btnLate.classList.contains('active')) {
    return false;
  }

  btnLate.classList.add('active');
  btnEarly.classList.remove('active');
  early.dataset.show = 'off';
  late.dataset.show = 'on';
});
