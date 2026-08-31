/* =============================================================
   Czat — teksty w językach obsługiwanych przez serwis.

   Plik ładowany PRZED czat-widget.js. Trzymamy go osobno, bo teksty
   zmieniają się częściej niż logika, a tłumacz nie powinien grzebać
   w kodzie widgetu.

   Dodanie języka = dodanie klucza. Brakujący język spada na angielski,
   a gdy i tego nie ma — na polski.

   UWAGA: wersje ukraińska i rosyjska wymagają sprawdzenia przez
   native speakera przed produkcją. Terminologia urzędowa jest tu
   wrażliwa i nie chcę, żeby kancelaria firmowała moje przybliżenie.
   ============================================================= */
window.PRC_CZAT_JEZYKI = {

  pl: {
    zaczepka: 'Masz pytanie o swoją sprawę?',
    naglowek: 'Wstępne rozpoznanie sprawy',
    podtytul: '4 pytania · odpowiedź do 3 dni roboczych',
    zamknij: 'Zamknij',
    intro: 'Dzień dobry. Kilka krótkich pytań i skierujemy sprawę do właściwej osoby. Zajmie to około minuty.',
    q1: 'Czego dotyczy Twoja sprawa?',
    q1opcje: ['Pobyt czasowy i praca', 'Studia', 'Rodzina / małżeństwo', 'Pobyt stały', 'Odmowa lub odwołanie', 'Zatrudniam cudzoziemca'],
    q2: 'Na jakim etapie jest sprawa?',
    q2opcje: ['Jeszcze nie składałem/-am wniosku', 'Wniosek złożony, czekam', 'Mam wezwanie z urzędu', 'Dostałem/-am odmowę', 'Pobyt już nielegalny'],
    q3: 'Opisz sprawę w kilku słowach — co jest największym problemem? Możesz też nacisnąć mikrofon i po prostu powiedzieć.',
    q3pole: 'Np. wiza kończy się za trzy tygodnie, zmieniłem pracodawcę…',
    q4: 'Zostaw numer telefonu lub e-mail — odezwiemy się w ciągu maksymalnie trzech dni roboczych.',
    q4pole: '+48 … albo adres e-mail',
    kontaktZly: 'Zostaw proszę numer telefonu albo adres e-mail.',
    pomin: 'Pomiń', wyslij: 'Wyślij',
    koniec: 'Dziękujemy. Prawnik przejrzy sprawę i skontaktuje się z Tobą w ciągu maksymalnie trzech dni roboczych.',
    koniecWa: 'Kontynuuj na WhatsAppie',
    koniecNota: 'Twoje odpowiedzi już do nas trafiły. WhatsApp tylko przyspieszy kontakt.',
    waPrefiks: 'Dzień dobry, wypełniłem/-am czat na Waszej stronie.',
    etSprawa: 'Sprawa', etEtap: 'Etap', etOpis: 'Opis', etKontakt: 'Kontakt',
    mikStart: 'Dyktuj — naciśnij i mów', mikStop: 'Zakończ dyktowanie',
    mikBrakZgody: 'Brak dostępu do mikrofonu. Zezwól na mikrofon w ustawieniach przeglądarki albo po prostu wpisz tekst.',
    mikCisza: 'Nic nie usłyszeliśmy. Spróbuj jeszcze raz albo wpisz tekst.',
    mikBlad: 'Dyktowanie nie zadziałało. Możesz wpisać tekst ręcznie.'
  },

  en: {
    zaczepka: 'A question about your case?',
    naglowek: 'Quick case review',
    podtytul: '4 questions · reply within 3 working days',
    zamknij: 'Close',
    intro: 'Hello. A few short questions and we will pass your case to the right person. It takes about a minute.',
    q1: 'What is your case about?',
    q1opcje: ['Temporary residence and work', 'Studies', 'Family / marriage', 'Permanent residence', 'Refusal or appeal', 'I employ foreigners'],
    q2: 'What stage is your case at?',
    q2opcje: ['I have not applied yet', 'Application submitted, waiting', 'I received a request from the office', 'I received a refusal', 'My stay is already irregular'],
    q3: 'Describe your case in a few words — what worries you most? You can also press the microphone and simply speak.',
    q3pole: 'E.g. my visa expires in three weeks, I changed employer…',
    q4: 'Leave a phone number or e-mail — we will get back to you within three working days at the latest.',
    q4pole: '+48 … or an e-mail address',
    kontaktZly: 'Please leave a phone number or an e-mail address.',
    pomin: 'Skip', wyslij: 'Send',
    koniec: 'Thank you. A lawyer will review your case and contact you within three working days at the latest.',
    koniecWa: 'Continue on WhatsApp',
    koniecNota: 'Your answers have already reached us. WhatsApp only makes it faster.',
    waPrefiks: 'Hello, I filled in the chat on your website.',
    etSprawa: 'Case', etEtap: 'Stage', etOpis: 'Details', etKontakt: 'Contact',
    mikStart: 'Dictate — press and speak', mikStop: 'Stop dictating',
    mikBrakZgody: 'No access to the microphone. Allow it in your browser settings, or simply type your answer.',
    mikCisza: 'We did not hear anything. Try again or type your answer.',
    mikBlad: 'Dictation did not work. You can type your answer instead.'
  },

  es: {
    zaczepka: '¿Tienes dudas sobre tu caso?',
    naglowek: 'Evaluación inicial del caso',
    podtytul: '4 preguntas · respuesta en hasta 3 días hábiles',
    zamknij: 'Cerrar',
    intro: 'Hola. Unas preguntas breves y pasaremos tu caso a la persona adecuada. Tomará alrededor de un minuto.',
    q1: '¿De qué trata tu caso?',
    q1opcje: ['Residencia temporal y trabajo', 'Estudios', 'Familia / matrimonio', 'Residencia permanente', 'Denegación o recurso', 'Contrato a extranjeros'],
    q2: '¿En qué etapa está tu caso?',
    q2opcje: ['Todavía no he presentado la solicitud', 'Solicitud presentada, esperando', 'Tengo un requerimiento de la oficina', 'He recibido una denegación', 'Mi estancia ya es irregular'],
    q3: 'Describe tu caso en pocas palabras: ¿qué es lo que más te preocupa? También puedes pulsar el micrófono y hablar.',
    q3pole: 'Por ejemplo: mi visado caduca en tres semanas, cambié de empleador…',
    q4: 'Déjanos un teléfono o un correo — te responderemos en un plazo máximo de tres días hábiles.',
    q4pole: '+48 … o una dirección de correo',
    kontaktZly: 'Déjanos por favor un número de teléfono o un correo electrónico.',
    pomin: 'Omitir', wyslij: 'Enviar',
    koniec: 'Gracias. Un abogado revisará tu caso y te contactará en un plazo máximo de tres días hábiles.',
    koniecWa: 'Continuar por WhatsApp',
    koniecNota: 'Tus respuestas ya nos han llegado. WhatsApp solo acelera el contacto.',
    waPrefiks: 'Hola, he rellenado el chat en su web.',
    etSprawa: 'Caso', etEtap: 'Etapa', etOpis: 'Detalles', etKontakt: 'Contacto',
    mikStart: 'Dictar — pulsa y habla', mikStop: 'Terminar el dictado',
    mikBrakZgody: 'Sin acceso al micrófono. Permítelo en los ajustes del navegador o simplemente escribe el texto.',
    mikCisza: 'No hemos oído nada. Inténtalo de nuevo o escribe el texto.',
    mikBlad: 'El dictado no funcionó. Puedes escribir el texto a mano.'
  },

  uk: {
    zaczepka: 'Маєте питання щодо своєї справи?',
    naglowek: 'Попередній розгляд справи',
    podtytul: '4 питання · відповідь до 3 робочих днів',
    zamknij: 'Закрити',
    intro: 'Доброго дня. Кілька коротких питань — і ми передамо справу потрібній людині. Це займе близько хвилини.',
    q1: 'Чого стосується ваша справа?',
    q1opcje: ['Тимчасове перебування і робота', 'Навчання', 'Родина / шлюб', 'Постійне перебування', 'Відмова або апеляція', 'Я працедавець'],
    q2: 'На якому етапі ваша справа?',
    q2opcje: ['Ще не подавав(-ла) заяву', 'Заяву подано, чекаю', 'Маю виклик з установи', 'Отримав(-ла) відмову', 'Перебування вже нелегальне'],
    q3: 'Опишіть справу кількома словами — що турбує найбільше? Можете також натиснути мікрофон і просто говорити.',
    q3pole: 'Наприклад: віза закінчується через три тижні, змінив(-ла) працедавця…',
    q4: 'Залиште номер телефону або e-mail — відповімо максимум протягом трьох робочих днів.',
    q4pole: '+48 … або адреса e-mail',
    kontaktZly: 'Залиште, будь ласка, номер телефону або адресу e-mail.',
    pomin: 'Пропустити', wyslij: 'Надіслати',
    koniec: 'Дякуємо. Юрист розгляне справу і зв’яжеться з вами максимум протягом трьох робочих днів.',
    koniecWa: 'Продовжити у WhatsApp',
    koniecNota: 'Ваші відповіді вже у нас. WhatsApp лише пришвидшить контакт.',
    waPrefiks: 'Доброго дня, я заповнив(-ла) чат на вашому сайті.',
    etSprawa: 'Справа', etEtap: 'Етап', etOpis: 'Опис', etKontakt: 'Контакт',
    mikStart: 'Диктувати — натисніть і говоріть', mikStop: 'Завершити диктування',
    mikBrakZgody: 'Немає доступу до мікрофона. Дозвольте його в налаштуваннях браузера або просто напишіть текст.',
    mikCisza: 'Ми нічого не почули. Спробуйте ще раз або напишіть текст.',
    mikBlad: 'Диктування не спрацювало. Ви можете написати текст вручну.'
  },

  ru: {
    zaczepka: 'Есть вопрос по вашему делу?',
    naglowek: 'Предварительная оценка дела',
    podtytul: '4 вопроса · ответ в течение 3 рабочих дней',
    zamknij: 'Закрыть',
    intro: 'Здравствуйте. Несколько коротких вопросов — и мы передадим дело нужному человеку. Это займёт около минуты.',
    q1: 'Чего касается ваше дело?',
    q1opcje: ['Временное пребывание и работа', 'Учёба', 'Семья / брак', 'Постоянное пребывание', 'Отказ или апелляция', 'Я работодатель'],
    q2: 'На каком этапе ваше дело?',
    q2opcje: ['Ещё не подавал(-а) заявление', 'Заявление подано, жду', 'Есть вызов из учреждения', 'Получил(-а) отказ', 'Пребывание уже нелегальное'],
    q3: 'Опишите дело в нескольких словах — что беспокоит больше всего? Можно также нажать микрофон и просто говорить.',
    q3pole: 'Например: виза заканчивается через три недели, сменил(-а) работодателя…',
    q4: 'Оставьте номер телефона или e-mail — ответим максимум в течение трёх рабочих дней.',
    q4pole: '+48 … или адрес e-mail',
    kontaktZly: 'Оставьте, пожалуйста, номер телефона или адрес e-mail.',
    pomin: 'Пропустить', wyslij: 'Отправить',
    koniec: 'Спасибо. Юрист рассмотрит дело и свяжется с вами максимум в течение трёх рабочих дней.',
    koniecWa: 'Продолжить в WhatsApp',
    koniecNota: 'Ваши ответы уже у нас. WhatsApp только ускорит контакт.',
    waPrefiks: 'Здравствуйте, я заполнил(-а) чат на вашем сайте.',
    etSprawa: 'Дело', etEtap: 'Этап', etOpis: 'Описание', etKontakt: 'Контакт',
    mikStart: 'Диктовать — нажмите и говорите', mikStop: 'Завершить диктовку',
    mikBrakZgody: 'Нет доступа к микрофону. Разрешите его в настройках браузера или просто напишите текст.',
    mikCisza: 'Мы ничего не услышали. Попробуйте ещё раз или напишите текст.',
    mikBlad: 'Диктовка не сработала. Вы можете написать текст вручную.'
  }

  /* fr: — nie ma. Francuski spadnie na angielski, dopóki ktoś nie przetłumaczy. */
};
