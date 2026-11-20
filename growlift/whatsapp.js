// Click counter for the WhatsApp buttons: this page is counted by Vercel Web Analytics (anonymous, no cookies),
// then it opens WhatsApp. The target comes from the page's data-wa attribute.
(function () {
  var to = document.documentElement.getAttribute('data-wa');
  if (to && /^https:\/\/wa\.me\//.test(to)) setTimeout(function () { location.replace(to); }, 500);
})();
