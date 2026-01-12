$(document).ready(function() {
    // Установим первую страницу как активную при загрузке
    $('#home').addClass('active');
    $('.nav-btn[data-page="home"]').addClass('active');
    
    // Навигация между страницами
    $('.nav-btn').on('click', function() {
        const pageId = $(this).data('page');
        
        // Скрыть все страницы
        $('.page').removeClass('active');
        
        // Показать выбранную страницу
        $('#' + pageId).addClass('active');
        
        // Подсветить активную кнопку
        $('.nav-btn').removeClass('active');
        $(this).addClass('active');
    });
    
    // Инициализация Яндекс карт
    initMaps();
    
    // Обработка формы гостей
    $('#guest-form').on('submit', function(e) {
        e.preventDefault();
        submitGuestForm();
    });
    
    // Показать/скрыть раздел о спутнике
    $('input[name="attendance"]').on('change', function() {
        if ($(this).val() === 'yes') {
            $('#companion-section').removeClass('hidden');
            // Делаем поля спутника обязательными, если гость придет
            $('#companion-name').prop('required', true);
            $('#food-preference').prop('required', true);
            $('#drink-preference').prop('required', true);
        } else {
            $('#companion-section').addClass('hidden');
            // Убираем обязательность полей спутника, если гость не придет
            $('#companion-name').prop('required', false);
            $('#food-preference').prop('required', false);
            $('#drink-preference').prop('required', false);
        }
    });
    
    // Функция инициализации карт
    function initMaps() {
        // Проверяем, загружена ли API Яндекс.Карт
        if (typeof ymaps === 'undefined') {
            console.log('Yandex Maps API не загружена, используем статические изображения');
            showStaticMaps();
            return;
        }
        
        ymaps.ready(function() {
            try {
                // Карта для ЗАГСа
                const mapZags = new ymaps.Map('map-zags', {
                    center: [59.9343, 30.2989], // Координаты Английская наб. 28
                    zoom: 16,
                    controls: ['zoomControl']
                });
                
                const zagsPlacemark = new ymaps.Placemark([59.9343, 30.2989], {
                    balloonContent: 'ЗАГС на Английской набережной 28'
                }, {
                    iconLayout: 'default#image',
                    iconImageHref: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/svgs/solid/ring.svg',
                    iconImageSize: [30, 30],
                    iconImageOffset: [-15, -30]
                });
                
                mapZags.geoObjects.add(zagsPlacemark);
                
                // Карта для места празднования
                const mapParty = new ymaps.Map('map-party', {
                    center: [60.1826, 29.7851], // Координаты Приморское ш. 452А
                    zoom: 15,
                    controls: ['zoomControl']
                });
                
                const partyPlacemark = new ymaps.Placemark([60.1826, 29.7851], {
                    balloonContent: 'Место празднования: Приморское шоссе 452А'
                }, {
                    iconLayout: 'default#image',
                    iconImageHref: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/svgs/solid/glass-cheers.svg',
                    iconImageSize: [30, 30],
                    iconImageOffset: [-15, -30]
                });
                
                mapParty.geoObjects.add(partyPlacemark);
            } catch (error) {
                console.error('Ошибка при загрузке Яндекс.Карт:', error);
                showStaticMaps();
            }
        });
    }
    
    // Функция для показа статических карт (если Яндекс.Карты не загрузились)
    function showStaticMaps() {
        $('#map-zags').html(`
            <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;">
                <p><strong>ЗАГС на Английской набережной 28</strong></p>
                <p>Санкт-Петербург</p>
                <p>Начало в 14:00</p>
                <div style="margin-top:15px;color:#8b7355;">
                    <i class="fas fa-map-marker-alt" style="font-size:24px;"></i>
                </div>
            </div>
        `);
        
        $('#map-party').html(`
            <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;">
                <p><strong>Место празднования</strong></p>
                <p>Приморское шоссе 452А</p>
                <p>Начало в 17:00</p>
                <div style="margin-top:15px;color:#8b7355;">
                    <i class="fas fa-glass-cheers" style="font-size:24px;"></i>
                </div>
            </div>
        `);
    }
    
    // Функция отправки формы гостя
    function submitGuestForm() {
        const formData = {
            name: $('#guest-name').val(),
            attendance: $('input[name="attendance"]:checked').val(),
            companion: $('#companion-name').val(),
            foodPreference: $('#food-preference').val(),
            drinkPreference: $('#drink-preference').val(),
            wishes: $('#wishes').val(),
            timestamp: new Date().toISOString()
        };
        
        // Проверка заполнения формы
        if (!formData.name || !formData.attendance) {
            showResponseMessage('Пожалуйста, заполните обязательные поля', 'error');
            return;
        }
        
        if (formData.attendance === 'yes') {
            if (!formData.companion || !formData.foodPreference || !formData.drinkPreference) {
                showResponseMessage('Пожалуйста, заполните информацию о спутнике', 'error');
                return;
            }
        }
        
        // В реальном проекте здесь должен быть AJAX запрос к серверу
        // Вместо этого покажем имитацию отправки
        console.log('Данные формы:', formData);
        
        // Имитация отправки на сервер
        setTimeout(function() {
            showResponseMessage('Спасибо за ваш ответ! Мы рады, что вы сможете разделить с нами этот день.', 'success');
            
            // Очищаем форму после успешной отправки
            $('#guest-form')[0].reset();
            $('#companion-section').addClass('hidden');
        }, 1000);
    }
    
    // Функция показа сообщения об отправке
    function showResponseMessage(message, type) {
        const responseDiv = $('#response-message');
        responseDiv.removeClass('hidden success error').addClass(type).text(message);
        
        // Автоматически скрыть сообщение через 5 секунд
        setTimeout(function() {
            responseDiv.addClass('hidden');
        }, 5000);
    }
  // В функции submitGuestForm() замените имитацию отправки на реальный AJAX запрос:
function submitGuestForm() {
    const formData = {
        name: $('#guest-name').val(),
        attendance: $('input[name="attendance"]:checked').val(),
        companion: $('#companion-name').val(),
        foodPreference: $('#food-preference').val(),
        drinkPreference: $('#drink-preference').val(),
        wishes: $('#wishes').val()
    };
    
    // Проверка заполнения формы
    if (!formData.name || !formData.attendance) {
        showResponseMessage('Пожалуйста, заполните обязательные поля', 'error');
        return;
    }
    
    if (formData.attendance === 'yes') {
        if (!formData.companion || !formData.foodPreference || !formData.drinkPreference) {
            showResponseMessage('Пожалуйста, заполните информацию о спутнике', 'error');
            return;
        }
    }
    
    // Отправка данных на сервер
    $.ajax({
        url: '/save_guest',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function(response) {
            if (response.success) {
                showResponseMessage(
                    response.message + ' Всего подтвердили участие: ' + response.attending_count, 
                    'success'
                );
                
                // Очищаем форму после успешной отправки
                $('#guest-form')[0].reset();
                $('#companion-section').addClass('hidden');
            } else {
                showResponseMessage(response.message, 'error');
            }
        },
        error: function() {
            showResponseMessage('Ошибка соединения с сервером. Попробуйте позже.', 'error');
        }
    });
}
});
