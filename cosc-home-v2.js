/* Natywne elementy details działają także bez JavaScript. */
document.querySelectorAll('.faq-list details').forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) document.querySelectorAll('.faq-list details').forEach(other => { if(other !== item) other.open = false; });
  });
});
