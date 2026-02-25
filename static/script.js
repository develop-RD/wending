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
    
    // Убедимся, что меню гостя и спутника скрыты при загрузке
    $('#guest-menu-section').addClass('hidden');
    $('#companion-section').addClass('hidden');
    $('#add-companion-btn').prop('disabled', false).text('Добавить спутника').css('background-color', '#7d6b52');
    let companinState = false; 
    // Обработка радио-кнопок присутствия
    $('input[name="attendance"]').on('change', function() {
        if ($(this).val() === 'yes') {
            // ПОКАЗЫВАЕМ меню для гостя
            $('#guest-menu-section').removeClass('hidden');
            
            // СКРЫВАЕМ секцию спутника (на случай если ранее показывали)
            $('#companion-section').addClass('hidden');
            $('#companion-menu-section').addClass('hidden');
            
            // Восстанавливаем кнопку добавления спутника
            $('#add-companion-btn').prop('disabled', false).text('Добавить спутника').css('background-color', '#7d6b52');
            
            // Делаем поля спутника НЕ обязательными (пока не добавили)
            $('#companion-name').prop('required', false);
            
        } else if ($(this).val() === 'no') {
            // Если гость не придет - скрываем ВСЕ меню
            $('#guest-menu-section').addClass('hidden');
            $('#companion-section').addClass('hidden');
            $('#companion-menu-section').addClass('hidden');
            
            // Восстанавливаем кнопку
            $('#add-companion-btn').prop('disabled', false).text('Добавить спутника').css('background-color', '#7d6b52');
            
            // Убираем обязательность полей спутника
            $('#companion-name').prop('required', false);
        }
    });
    
    // Обработка кнопки добавления спутника
    $('#add-companion-btn').on('click', function() {
        if (companinState == false){
            companinState = true;
            $(this).prop('disabled', false).text('Скрыть спутника').css('background-color', '#5a4a3a');
        // Показываем секцию спутника
        $('#companion-section').removeClass('hidden');
        // Показываем меню для спутника
        $('#companion-menu-section').removeClass('hidden');
        
        // Делаем имя спутника обязательным
        $('#companion-name').prop('required', true);

        }else{
            companinState = false;
            $(this).prop('disabled', false).text('Добавить спутнкиа').css('background-color', '#5a4a3a');
        // Показываем секцию спутника
        $('#companion-section').addClass('hidden');
        // Показываем меню для спутника
        $('#companion-menu-section').addClass('hidden');
        
        // Делаем имя спутника обязательным
        $('#companion-name').prop('required', true);

        }

        console.log(companinState); 
        // Блокируем кнопку и меняем текст
    });
    
    // Обработка формы гостей
    $('#guest-form').on('submit', function(e) {
        e.preventDefault();
        submitGuestForm();
        console.log('sending!')
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
                <p style="margin:5px 0;"><strong>Начало в 11:00</strong></p>
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
                <p style="margin:5px 0;"><strong>Начало в 14:00</strong></p>
                <p style="margin:5px 0;">21 августа 2023</p>
                <div style="margin-top:20px;padding:10px;background:rgba(139,115,85,0.1);border-radius:10px;">
                    <p style="margin:0;font-size:14px;color:#666;">📍 Отметка места на карте</p>
                </div>
            </div>
        `);
    }
    
    // Функция отправки формы гостя
    function submitGuestForm() {
        // Собираем данные о выбранных блюдах и напитках для гостя, а так же трансфере
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
       
      const transferStatus = document.getElementById('transferStatus');
    
      
            console.log("status = ",transferStatus.value);
        const formData = {
            name: $('#guest-name').val(),
            bus:  transferStatus.value,
            attendance: $('input[name="attendance"]:checked').val(),
            companion: $('#companion-name').val(),
            guestFood: guestFood,
            guestDrink: guestDrink,
            companionFood: companionFood,
            companionDrink: companionDrink,
            wishes: $('#wishes').val()
        };
        
        // Проверка заполнения формы
        if (!formData.name || !formData.attendance) {
            showResponseMessage('Пожалуйста, заполните обязательные поля', 'error');
            return;
        }
        
        // Дополнительная проверка: если гость приходит, но не выбрал блюда
        if (formData.attendance === 'yes' && guestFood.length === 0 && guestDrink.length === 0) {
            showResponseMessage('Пожалуйста, выберите хотя бы одно блюдо или напиток для себя', 'error');
            return;
        }
        
        // Дополнительная проверка: если добавлен спутник, но не указано имя
        if ($('#companion-section').hasClass('hidden') === false && 
            $('#companion-menu-section').hasClass('hidden') === false &&
            (!formData.companion || formData.companion.trim() === '')) {
            showResponseMessage('Пожалуйста, укажите имя спутника', 'error');
            return;
        }
        
        // Отправка данных на сервер
        $.ajax({
            url: '/save_guest',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    showResponseMessage(response.message, 'success');
                    // Очищаем форму после успешной отправки
                    $('#guest-form')[0].reset();
                    
                    // Скрываем все секции
                    $('#guest-menu-section').addClass('hidden');
                    $('#companion-section').addClass('hidden');
                    $('#companion-menu-section').addClass('hidden');
                    
                    // Восстанавливаем кнопку
                    $('#add-companion-btn').prop('disabled', false).text('Добавить спутника').css('background-color', '#7d6b52');
                    
                    // Сбрасываем все checkbox
                    $('input[type="checkbox"]').prop('checked', false);
                    // Сбрасываем радио-кнопки
                    $('input[type="radio"]').prop('checked', false);
                    
                } else {
                    showResponseMessage(response.message, 'error');
                }
            },
            error: function() {
                showResponseMessage('Ошибка при отправке данных. Пожалуйста, попробуйте позже.', 'error');
            }
        });
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
