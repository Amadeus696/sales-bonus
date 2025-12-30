/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */

    // @TODO: Расчет выручки от операции
    
function calculateSimpleRevenue(purchase, _product) {
    const { discount = 0, sale_price, quantity } = purchase;
    return sale_price * quantity * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */

    // @TODO: Расчет бонуса от позиции в рейтинге

function calculateBonusByProfit(index, total, seller) {
    let bonusPercentage;

    if (index === 0) {                            // первое место получает 15% от прибыли
        bonusPercentage = 0.15;
    } else if (index === 1 || index === 2) {      // второе и третье место получают 10% от прибыли
        bonusPercentage = 0.10;
    } else if (index === total - 1) {             // последнее место бонуса не получает (0%)
        bonusPercentage = 0;                      // все остальные получают 5% от прибыли
    } else {
        bonusPercentage = 0.05;
    }

    return bonusPercentage * (seller.profit || 0);
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {

    // @TODO: Проверка входных данных

    if (!data || typeof data !== 'object') {
        throw new Error("Некорректные входные данные: data должен быть объектом");
    }

    if (!data.sellers || !Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error("Некорректные входные данные: отсутствуют продавцы");
    }

    if (!data.product || !Array.isArray(data.product) || data.product.length === 0) {
        throw new Error("Некорректные входные данные: отсутствуют товары");
    }

    if (!data.purchase_records || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error("Некорректные входные данные: отсутствуют записи о покупках");
    }

    // @TODO: Проверка наличия опций

    if (!options || typeof options !== 'object') {
        throw new Error("Неверные опции рассчета");
    }

    if (typeof options.calculateRevenue !== 'function') {
        throw new Error("Отсутствует функция calculateRevenue");
    }

    if (typeof options.calculateBonus !== 'function') {
        throw new Error("Отсутствует функция calculateBonus");
    }

     // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({       // массив для хранения статистики о каждом продавце
        id: seller.id,
        first_name: seller.first_name,
        last_name: seller.last_name,
        sales_count: 0,                     // кол-во чеков
        revenue: 0,                         // общая выручка
        profit: 0,                          // общая прибыль
        products_sold: {}                   // товары и их кол-во
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = {};                 // поиск продавца по ID
    sellerStats.forEach(seller => {
        sellerIndex[seller.id] = seller;
    });

    const productIndex = {};
    data.product.forEach(product => {       // поиск товара по SKU
        sellerIndex[seller.id] = product;
    });

    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => {                                                   // нашли продавца
        const seller = sellerIndex[record.seller_id];

        if (!seller) {
            console.warn('Продавец с ID ${records.seller_id} не найден, пропуск записи');       // если не найден
            return;
        }

        seller.sales_count += 1;                                                                // увеличиваем количество чеков

        record.items.forEach(item => {                                                          // проходим по каждому товару в чеке
            const product = productIndex[item.sku];                                             // находим карточку товара по номеру sku

        if (!product) {                                                                         // если такого товара нет
            console.warn('Товар с SKU ${item.sku} не найден, пропускаем');
            return;
        }

        const cost = product.purchase_price * item.quantity;                                     // считаем себестоимость (закупочная х количество)

        const revenue = options.calculateRevenue(item, product);                                 // рассчитываем выручку от этого товара с учетом скидки

        const profit = revenue - cost;                                                           // прибыль от этого товара

        seller.revenue += revenue;                                                               // добавляем к статистике продавца
        seller.profit += profit;

        if (!seller.products_sold[item.sku]) {                                                   // считаем количество проданных товаров по SKU
            seller.products_sold[item.sku] = 0;
        }
        seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования

    sellerStats.forEach((seller, index) => {
        seller.bonus = options.calculateBonus(index, sellerStats.length, seller);                 // считаем бонус по месту в рейтинге

    // рассчет топ товаров продавца

    seller.top_products = Object.entries(seller.products_sold)                                    // преобразуем объект products_sold в массив и сортируем
        .map(([sku, quantity]) => ({
            sku,
            quantity,
            name: productIndex[sku]?.name || sku                                                  // добавляем название товара
        }))
        .sort((a, b) => b.quantity - a.quantity)                                                  // сортируем по убыванию кол-ва
        .slice(0, 10);                                                                            // берем первые 10
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: '&{seller.first_name} ${seller.last_name}',
        revenue: Number(seller.revenue.toFixed(2)),                                               // округлили до 2-х значений после запятой
        profit: Number(seller.profit.toFixed(2)),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: Number(seller.bonus.toFixed(2))
    }));
}
