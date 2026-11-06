/* Wspólna stopka bez usuwania oryginalnych danych, dat i zastrzeżeń. */
(() => {
  function mount() {
    if (!document.body.classList.contains('cosc-unified') || document.body.classList.contains('cosc-modern')) return;
    const lang = document.documentElement.lang.slice(0,2);
    const labels = {
      pl:['Kontakt','Poradniki','Kalkulator pobytu','Przejdź do treści'],
      en:['Contact','Guides','Stay calculator','Skip to content'],
      es:['Contacto','Guías','Calculadora de estancia','Ir al contenido'],
      uk:['Контакти','Посібники','Калькулятор перебування','Перейти до вмісту'],
      ru:['Контакты','Руководства','Калькулятор пребывания','Перейти к содержимому'],
      fr:['Contact','Guides','Calculateur de séjour','Aller au contenu']
    };
    const t=labels[lang]||labels.pl,home=lang==='pl'?'/':'/'+lang+'/';
    const contact=lang==='en'?'/en/contact.html':lang==='es'?'/es/contacto.html':home+'kontakt.html';
    let footer=document.querySelector('body>footer');
    if(!footer){footer=document.createElement('footer');document.body.appendChild(footer);}
    if(footer.querySelector('.cosc-footer-content')) return;
    const content=document.createElement('div');content.className='cosc-footer-content';
    while(footer.firstChild) content.appendChild(footer.firstChild);
    const brand=document.createElement('div');brand.className='cosc-footer-brand';
    brand.innerHTML='<a href="'+home+'" aria-label="COSC">COSC</a><nav aria-label="COSC"><a href="'+contact+'">'+t[0]+'</a><a href="'+home+'#poradniki">'+t[1]+'</a><a href="'+(lang==='es'?'/es/calculadora-90-180.html':'/kalkulator-90-180.html')+'">'+t[2]+'</a></nav>';
    content.prepend(brand);footer.appendChild(content);
    const target=document.querySelector('main,h1');
    if(target&&!document.querySelector('.cosc-skip-link')){
      if(!target.id)target.id='cosc-content';
      const skip=document.createElement('a');skip.className='cosc-skip-link';skip.href='#'+target.id;skip.textContent=t[3];document.body.prepend(skip);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
