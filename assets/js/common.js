//外部サイトを別タブで開く
let external_link__add_blank = function () {
  let a_tags = document.querySelectorAll('a:not([target="_blank"])'),
    res = [];
  if (!a_tags.length) return;
  for (let i = 0; i < a_tags.length; i++) {
    if (a_tags[i].href.indexOf(window.location.host) !== -1) continue;
    if (a_tags[i].href.indexOf('#') === 1) continue;
    a_tags[i].setAttribute('target', '_blank');
    res.push(a_tags[i])
  }
  return res;
}
document.addEventListener('DOMContentLoaded', external_link__add_blank, false);

//トップへ戻る
const footer = document.querySelector("footer");
const pageTopBtn = document.createElement("div");
pageTopBtn.setAttribute('id', 'pagetop');
footer.appendChild(pageTopBtn);

pageTopBtn.addEventListener("click", function () {
  const me = arguments.callee;
  const nowY = window.pageYOffset;
  window.scrollTo(0, Math.floor(nowY * 0.8));
  if (nowY > 0) {
    window.setTimeout(me, 10);
  }
});
