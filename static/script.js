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
        } else {
            $('#companion-section').addClass('hidden');
            // Убираем обязательность полей спутника, если гость не придет
            $('#companion-name').prop('required', false);
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
                    zoom: 17,
                    controls: ['zoomControl', 'fullscreenControl']
                });
                
                const zagsPlacemark = new ymaps.Placemark([59.9343, 30.2989], {
                    balloonContentHeader: 'ЗАГС №1',
                    balloonContentBody: '<p>Английская набережная 28<br>Начало в 14:00</p>',
                    balloonContentFooter: '21 августа 2023'
                }, {
                    preset: 'islands#darkGreenIcon',
                    iconColor: '#8b7355'
                });
                
                mapZags.geoObjects.add(zagsPlacemark);
                
                // Карта для места празднования
                const mapParty = new ymaps.Map('map-party', {
                    center: [60.1826, 29.7851], // Координаты Приморское ш. 452А
                    zoom: 16,
                    controls: ['zoomControl', 'fullscreenControl']
                });
                
                const partyPlacemark = new ymaps.Placemark([60.1826, 29.7851], {
                    balloonContentHeader: 'Место празднования',
                    balloonContentBody: '<p>Приморское шоссе 452А<br>Начало в 17:00</p>',
                    balloonContentFooter: 'Банкетный зал "Лесная сказка"'
                }, {
                    preset: 'islands#darkGreenIcon',
                    iconColor: '#8b7355'
                });
                
                mapParty.geoObjects.add(partyPlacemark);
                
                // Автоматически подгоняем размер карты
                setTimeout(function() {
                    mapZags.container.fitToViewport();
                    mapParty.container.fitToViewport();
                }, 1000);
                
            } catch (error) {
                console.error('Ошибка при загрузке Яндекс.Карт:', error);
                showStaticMaps();
            }
        });
    }
    
    // Функция для показа статических карт (если Яндекс.Карты не загрузились)
    function showStaticMaps() {
        $('#map-zags').html(`
            <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;background:linear-gradient(135deg, #f9f3e9 0%, #f5ebdc 100%);">
                <div style="margin-bottom:15px;">
                    <i class="fas fa-ring" style="font-size:48px;color:#8b7355;"></i>
                </div>
                <h4 style="margin:10px 0;color:#8b7355;">ЗАГС на Английской набережной 28</h4>
                <p style="margin:5px 0;">Санкт-Петербург</p>
                <p style="margin:5px 0;"><strong>Начало в 14:00</strong></p>
                <p style="margin:5px 0;">21 августа 2023</p>
                <div style="margin-top:20px;padding:10px;background:rgba(139,115,85,0.1);border-radius:10px;">
                    <p style="margin:0;font-size:14px;color:#666;">📍 Отметка места на карте</p>
                </div>
            </div>
        `);
        
        $('#map-party').html(`
            <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;background:linear-gradient(135deg, #f9f3e9 0%, #f5ebdc 100%);">
                <div style="margin-bottom:15px;">
                    <i class="fas fa-glass-cheers" style="font-size:48px;color:#8b7355;"></i>
                </div>
                <h4 style="margin:10px 0;color:#8b7355;">Банкетный зал "Лесная сказка"</h4>
                <p style="margin:5px 0;">Приморское шоссе 452А</p>
                <p style="margin:5px 0;"><strong>Начало в 17:00</strong></p>
                <p style="margin:5px 0;">21 августа 2023</p>
                <div style="margin-top:20px;padding:10px;background:rgba(139,115,85,0.1);border-radius:10px;">
                    <p style="margin:0;font-size:14px;color:#666;">📍 Отметка места на карте</p>
                </div>
            </div>
        `);
    }
    
    // Функция отправки формы гостя
    function submitGuestForm() {
        // Собираем данные о выбранных блюдах и напитках для гостя
        const guestFood = [];
        $('input[name="guest-food"]:checked').each(function() {
            guestFood.push($(this).val());
        });
        
        const guestDrink = [];
        $('input[name="guest-drink"]:checked').each(function() {
            guestDrink.push($(this).val());
        });
        
        // Собираем данные о выбранных блюдах и напитках для спутника
        const companionFood = [];
        $('input[name="companion-food"]:checked').each(function() {
            companionFood.push($(this).val());
        });
        
        const companionDrink = [];
        $('input[name="companion-drink"]:checked').each(function() {
            companionDrink.push($(this).val());
        });
        
        const formData = {
            name: $('#guest-name').val(),
            attendance: $('input[name="attendance"]:checked').val(),
            companion: $('#companion-name').val(),
            guestFood: guestFood,
            guestDrink: guestDrink,
            companionFood: companionFood,
            companionDrink: companionDrink,
            wishes: $('#wishes').val(),
            timestamp: new Date().toISOString()
        };
        
        // Проверка заполнения формы
        if (!formData.name || !formData.attendance) {
            showResponseMessage('Пожалуйста, заполните обязательные поля', 'error');
            return;
        }
        
        if (formData.attendance === 'yes') {
            if (guestFood.length === 0 || guestDrink.length === 0) {
                showResponseMessage('Пожалуйста, выберите блюда и напитки для себя', 'error');
                return;
            }
            
            // Проверяем, заполнено ли имя спутника
            if (formData.companion && formData.companion.trim() !== '') {
                if (companionFood.length === 0 || companionDrink.length === 0) {
                    showResponseMessage('Пожалуйста, выберите блюда и напитки для спутника', 'error');
                    return;
                }
            }
        }
        
        // В реальном проекте здесь должен быть AJAX запрос к серверу
        // Вместо этого покажем имитацию отправки
        console.log('Данные формы:', formData);
        
        // Формируем сообщение с выбранными блюдами
        let selectedFoodMessage = '';
        if (guestFood.length > 0) {
            selectedFoodMessage += 'Вы выбрали: ' + guestFood.join(', ') + '. ';
        }
        if (companionFood.length > 0 && formData.companion) {
            selectedFoodMessage += 'Спутник выбрал: ' + companionFood.join(', ') + '.';
        }
        
        // Имитация отправки на сервер
        setTimeout(function() {
            showResponseMessage('Спасибо за ваш ответ! ' + selectedFoodMessage, 'success');
            
            // Очищаем форму после успешной отправки
            $('#guest-form')[0].reset();
            $('#companion-section').addClass('hidden');
            
            // Сбрасываем все checkbox
            $('input[type="checkbox"]').prop('checked', false);
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
});
