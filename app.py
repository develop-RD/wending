from flask import Flask, render_template, request, jsonify, g, session, redirect, url_for
import sqlite3
import os
import secrets
import time
import threading
from functools import wraps
from contextlib import contextmanager

# Инициализация приложения
app = Flask(__name__)

# Блокировка для безопасного доступа к БД
db_lock = threading.Lock()

# Генерация секретного ключа
def generate_secret_key():
    key_file = 'secret_key.txt'
    
    if os.path.exists(key_file):
        with open(key_file, 'r') as f:
            return f.read().strip()
    else:
        new_key = secrets.token_hex(32)
        with open(key_file, 'w') as f:
            f.write(new_key)
        return new_key

# Настройка приложения
app.config['DATABASE'] = 'wedding_guests.db'
app.config['SECRET_KEY'] = generate_secret_key()
app.config['DATABASE_TIMEOUT'] = 30

# Контекстный менеджер для безопасной работы с БД
@contextmanager
def get_db_connection():
    """Безопасное подключение к базе данных с повторными попытками"""
    conn = None
    for attempt in range(3):  # 3 попытки
        try:
            conn = sqlite3.connect(
                app.config['DATABASE'],
                timeout=app.config['DATABASE_TIMEOUT'],
                check_same_thread=False
            )
            # Оптимизируем настройки SQLite
            conn.execute('PRAGMA journal_mode=WAL')
            conn.execute('PRAGMA cache_size=-10000')  # 10MB кэша
            conn.execute('PRAGMA synchronous=NORMAL')
            conn.execute('PRAGMA foreign_keys=ON')
            conn.row_factory = sqlite3.Row
            break
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e) and attempt < 2:
                time.sleep(0.05 * (attempt + 1))  # Увеличиваем задержку
                continue
            else:
                raise e
    
    try:
        yield conn
    finally:
        if conn:
            conn.close()

def get_db_cursor():
    """Получение курсора для работы с БД"""
    with db_lock:  # Блокируем доступ для безопасности
        with get_db_connection() as conn:
            return conn.cursor()

# Инициализация БД
def init_db():
    """Инициализация базы данных при первом запуске"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Таблица гостей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS guests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                attendance TEXT NOT NULL CHECK(attendance IN ('yes', 'no')),
                companion_name TEXT,
                food_preference TEXT,
                drink_preference TEXT,
                wishes TEXT,
                submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Индексы для ускорения поиска
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_attendance ON guests(attendance)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_submission_date ON guests(submission_date)')
        
        conn.commit()

# Декоратор для защиты админ-панели
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_logged_in' not in session:
            return redirect(url_for('admin_login_page'))
        return f(*args, **kwargs)
    return decorated_function

# Маршруты приложения
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save_guest', methods=['POST'])
def save_guest():
    try:
        data = request.json
        
        # Валидация данных
        if not data or not data.get('name') or len(data.get('name', '').strip()) < 2:
            return jsonify({"success": False, "message": "Пожалуйста, введите корректное имя"})
        
        if data.get('attendance') not in ['yes', 'no']:
            return jsonify({"success": False, "message": "Неверный статус присутствия"})
        
        # Обработка выбранных блюд и напитков для гостя
        guest_food_list = data.get('guestFood', [])
        guest_drink_list = data.get('guestDrink', [])
        
        # Обработка выбранных блюд и напитков для спутника
        companion_food_list = data.get('companionFood', [])
        companion_drink_list = data.get('companionDrink', [])
        
        # Объединяем все выбранные блюда и напитки
        all_food = []
        all_drinks = []
        
        if guest_food_list:
            all_food.extend(guest_food_list)
        
        if companion_food_list:
            all_food.extend(companion_food_list)
        
        if guest_drink_list:
            all_drinks.extend(guest_drink_list)
        
        if companion_drink_list:
            all_drinks.extend(companion_drink_list)
        
        # Формируем строки для сохранения в БД
        food_preference_str = ', '.join(all_food) if all_food else None
        drink_preference_str = ', '.join(all_drinks) if all_drinks else None
        
        # Подготовка данных
        guest_data = (
            data.get('name', '').strip(),
            data.get('attendance'),
            data.get('companion', '').strip() if data.get('companion') else None,
            food_preference_str,
            drink_preference_str,
            data.get('wishes', '').strip()[:1000] if data.get('wishes') else None
        )
        print("guest = ",guest_food_list);
        print("guest = ",guest_drink_list);
        print("comp = ",companion_food_list);
        print("comp = ",companion_drink_list);
        
        # Сохранение в БД с блокировкой
        with db_lock:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO guests (name, attendance, companion_name, food_preference, drink_preference, wishes)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', guest_data)
                
                conn.commit()
                
                # Получение статистики
                cursor.execute("SELECT COUNT(*) as total FROM guests WHERE attendance = 'yes'")
                attending_count = cursor.fetchone()['total']
        
        return jsonify({
            "success": True, 
            "message": "Спасибо за ответ! Мы рады, что вы сможете разделить с нами этот день.",
            "attending_count": attending_count
        })
        
    except sqlite3.Error as e:
        print(f"Ошибка базы данных при сохранении гостя: {e}")
        # Проверяем, не связана ли ошибка с блокировкой
        if "database is locked" in str(e):
            return jsonify({
                "success": False, 
                "message": "Извините, система временно перегружена. Пожалуйста, попробуйте отправить ответ через несколько секунд."
            })
        return jsonify({"success": False, "message": "Произошла ошибка при сохранении данных"})
    except Exception as e:
        print(f"Общая ошибка при сохранении гостя: {e}")
        return jsonify({"success": False, "message": "Произошла непредвиденная ошибка"})

# Административная панель
@app.route('/admin')
def admin_login_page():
    if 'admin_logged_in' in session:
        return redirect(url_for('admin_dashboard'))
    return render_template('admin_login.html')

@app.route('/admin/login', methods=['POST'])
def admin_login():
    username = request.form.get('username')
    password = request.form.get('password')
    
    # Используйте переменные окружения для реального проекта!
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'wedding2023')
    
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session['admin_logged_in'] = True
        session.permanent = True
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "message": "Неверные данные для входа"})

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin_login_page'))

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    try:
        with db_lock:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Получаем всех гостей
                cursor.execute("SELECT * FROM guests ORDER BY submission_date DESC")
                guests = cursor.fetchall()
                
                # Статистика
                cursor.execute("SELECT COUNT(*) as total FROM guests")
                total_guests = cursor.fetchone()['total']
                
                cursor.execute("SELECT COUNT(*) as attending FROM guests WHERE attendance = 'yes'")
                attending_guests = cursor.fetchone()['attending']
                
                cursor.execute("SELECT COUNT(*) as not_attending FROM guests WHERE attendance = 'no'")
                not_attending_guests = cursor.fetchone()['not_attending']
                
                cursor.execute("SELECT COUNT(*) as with_companion FROM guests WHERE companion_name IS NOT NULL AND companion_name != ''")
                with_companion = cursor.fetchone()['with_companion']
                
                # Подсчитываем общее количество участников
                cursor.execute("""
                    SELECT COUNT(*) as companions 
                    FROM guests 
                    WHERE attendance = 'yes' 
                    AND companion_name IS NOT NULL 
                    AND companion_name != ''
                """)
                companions_count = cursor.fetchone()['companions']
                total_participants = attending_guests + companions_count
                
                # Статистика по предпочтениям - переделана для анализа отдельных блюд
                all_food_items = []
                all_drink_items = []
                
                # Собираем все предпочтения в еде
                cursor.execute("SELECT food_preference FROM guests WHERE food_preference IS NOT NULL AND food_preference != ''")
                food_rows = cursor.fetchall()
                for row in food_rows:
                    items = [item.strip() for item in row['food_preference'].split(',') if item.strip()]
                    all_food_items.extend(items)
                
                # Собираем все предпочтения в напитках
                cursor.execute("SELECT drink_preference FROM guests WHERE drink_preference IS NOT NULL AND drink_preference != ''")
                drink_rows = cursor.fetchall()
                for row in drink_rows:
                    items = [item.strip() for item in row['drink_preference'].split(',') if item.strip()]
                    all_drink_items.extend(items)
                
                # Подсчитываем статистику по каждому блюду
                food_stats_dict = {}
                for item in all_food_items:
                    food_stats_dict[item] = food_stats_dict.get(item, 0) + 1
                
                # Сортируем по количеству выборов
                food_stats = [{'food_preference': item, 'count': count} 
                            for item, count in sorted(food_stats_dict.items(), key=lambda x: x[1], reverse=True)]
                
                # Подсчитываем статистику по каждому напитку
                drink_stats_dict = {}
                for item in all_drink_items:
                    drink_stats_dict[item] = drink_stats_dict.get(item, 0) + 1
                
                # Сортируем по количеству выборов
                drink_stats = [{'drink_preference': item, 'count': count} 
                              for item, count in sorted(drink_stats_dict.items(), key=lambda x: x[1], reverse=True)]
                
                # Последние ответы
                cursor.execute("SELECT * FROM guests ORDER BY submission_date DESC LIMIT 5")
                recent_guests = cursor.fetchall()
        
        return render_template('admin_dashboard.html',
                             guests=guests,
                             total_guests=total_guests,
                             attending_guests=attending_guests,
                             not_attending_guests=not_attending_guests,
                             with_companion=with_companion,
                             total_participants=total_participants,
                             food_stats=food_stats,
                             drink_stats=drink_stats,
                             recent_guests=recent_guests)
                             
    except sqlite3.Error as e:
        print(f"Ошибка БД при загрузке админки: {e}")
        return "Ошибка базы данных. Пожалуйста, попробуйте позже.", 500

# Экспорт данных
@app.route('/admin/export')
@login_required
def export_data():
    try:
        with db_lock:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM guests ORDER BY submission_date DESC")
                guests = cursor.fetchall()
        
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        
        writer.writerow(['ID', 'Имя', 'Присутствие', 'Спутник', 'Предпочтения в еде', 
                        'Предпочтения в напитках', 'Пожелания', 'Дата ответа'])
        
        for guest in guests:
            writer.writerow([
                guest['id'],
                guest['name'],
                'Да' if guest['attendance'] == 'yes' else 'Нет',
                guest['companion_name'] or '',
                guest['food_preference'] or '',
                guest['drink_preference'] or '',
                guest['wishes'] or '',
                guest['submission_date']
            ])
        
        output.seek(0)
        
        from flask import make_response
        response = make_response(output.getvalue())
        response.headers["Content-Disposition"] = "attachment; filename=wedding_guests.csv"
        response.headers["Content-type"] = "text/csv; charset=utf-8"
        return response
        
    except sqlite3.Error as e:
        print(f"Ошибка БД при экспорте: {e}")
        return "Ошибка базы данных при экспорте.", 500

# API для статистики
@app.route('/api/stats')
def api_stats():
    try:
        with db_lock:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("SELECT COUNT(*) as total FROM guests")
                total = cursor.fetchone()['total']
                
                cursor.execute("SELECT COUNT(*) as attending FROM guests WHERE attendance = 'yes'")
                attending = cursor.fetchone()['attending']
        
        return jsonify({
            "total_guests": total,
            "attending_guests": attending,
            "not_attending_guests": total - attending
        })
    except sqlite3.Error as e:
        print(f"Ошибка БД при получении статистики: {e}")
        return jsonify({"error": "Database error"}), 500

# Очистка старых соединений (периодическая задача)
def cleanup_database():
    """Периодическая очистка старых соединений"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # Эта команда помогает освободить блокировки
            cursor.execute('PRAGMA optimize')
            conn.commit()
    except:
        pass

# Запуск приложения
if __name__ == '__main__':
    # Инициализация БД
    if not os.path.exists(app.config['DATABASE']):
        print(f"Создаем новую базу данных: {app.config['DATABASE']}")
        init_db()
    else:
        # Проверяем структуру
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM guests")
        except sqlite3.OperationalError:
            print("Пересоздаем базу данных...")
            os.remove(app.config['DATABASE'])
            init_db()
    
    print(f"Для входа в админ-панель:")
    print(f"Логин: {os.environ.get('ADMIN_USERNAME', 'admin')}")
    print(f"Пароль: {os.environ.get('ADMIN_PASSWORD', 'wedding2025')}")
    print(f"Админ-панель: http://localhost:5000/admin")
    
    # Запускаем периодическую очистку
    import atexit
    atexit.register(cleanup_database)
    
    # Настройки для разработки
    app.run(
        host="192.168.0.110",
        debug=True, 
        port=8080,
        threaded=True,  # Разрешаем многопоточность
        processes=1     # Используем только один процесс для SQLite
    )
