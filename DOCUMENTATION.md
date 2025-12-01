# Документация Screeps-Play

Этот документ описывает основные классы и методы библиотеки `screeps-play`.

## CreepWrapper

Класс `CreepWrapper` предоставляет удобную обертку над стандартным объектом `Creep` в Screeps. Он упрощает выполнение общих задач, таких как поиск объектов, перемещение и управление инвентарем.

### findClosest

Находит ближайший объект указанного типа к текущему крипу.

**Параметры:**
- `type`: Тип объекта для поиска (`'source'`, `'enemy'`, `'controller'`, `'spawn'`, `'constructionSite'`).

**Возвращает:**
Ближайший объект указанного типа или `null`, если ничего не найдено.

**Пример:**
```typescript
// Найти ближайший источник энергии
const source = creep.findClosest('source');
if (source) {
    creep.storage.harvest(source);
}
```

### moveCloseTo

Перемещает крипа так, чтобы он оставался в пределах указанного радиуса от цели.

**Параметры:**
- `target`: Целевая позиция или объект с позицией.
- `range`: Желаемое расстояние до цели (по умолчанию 1).
- `opts`: Дополнительные опции движения (как в `moveTo`).

**Возвращает:**
Код результата `moveTo` или `OK`, если крип уже на месте.

**Пример:**
```typescript
// Подойти к контроллеру на расстояние 3 клетки
creep.moveCloseTo(controller, 3);
```

### moveTo

Перемещает крипа к указанной цели.

**Параметры:**
- `target`: Целевая позиция.
- `opts`: Опции движения.

**Возвращает:**
Код результата `moveTo`.

**Пример:**
```typescript
creep.moveTo(flag);
```

### upgradeController

Пытается улучшить контроллер комнаты, используя энергию крипа.

**Параметры:**
- `controller`: Объект контроллера.

**Возвращает:**
Код результата Screeps.

**Пример:**
```typescript
if (creep.isNear(controller, 3)) {
    creep.upgradeController(controller);
}
```

### build

Пытается строить указанную строительную площадку.

**Параметры:**
- `site`: Объект строительной площадки (`ConstructionSite`).

**Возвращает:**
Код результата Screeps.

**Пример:**
```typescript
const site = creep.findClosest('constructionSite');
if (site) {
    creep.build(site);
}
```

### isNear

Проверяет, находится ли крип в пределах указанного радиуса от цели.

**Параметры:**
- `target`: Цель для проверки.
- `range`: Радиус (по умолчанию 1).

**Возвращает:**
`true`, если крип рядом, иначе `false`.

**Пример:**
```typescript
if (!creep.isNear(source)) {
    creep.moveTo(source);
}
```

### getName

Возвращает имя крипа.

**Пример:**
```typescript
console.log(creep.getName());
```

### getMemory

Возвращает объект памяти крипа.

**Пример:**
```typescript
const mem = creep.getMemory();
if (mem.role === 'harvester') { ... }
```

### getCreep

Возвращает оригинальный объект `Creep`.

**Пример:**
```typescript
const rawCreep = wrapper.getCreep();
rawCreep.say('Hello');
```

---

## CreepWrapper.storage

Набор методов для работы с инвентарем (энергией) крипа. Доступен через свойство `.storage`.

### storage.isFull

Проверяет, полон ли инвентарь крипа.

**Возвращает:**
`true`, если места нет.

**Пример:**
```typescript
if (creep.storage.isFull()) {
    // Идти работать
}
```

### storage.isEmpty

Проверяет, пуст ли инвентарь крипа.

**Возвращает:**
`true`, если энергии нет.

**Пример:**
```typescript
if (creep.storage.isEmpty()) {
    // Идти добывать
}
```

### storage.getEnergy

Возвращает текущее количество энергии у крипа.

**Пример:**
```typescript
const energy = creep.storage.getEnergy();
```

### storage.getFreeCapacity

Возвращает количество свободного места для энергии.

**Пример:**
```typescript
const freeSpace = creep.storage.getFreeCapacity();
```

### storage.getCapacity

Возвращает общую вместимость крипа.

**Пример:**
```typescript
const total = creep.storage.getCapacity();
```

### storage.harvest

Пытается добыть энергию из источника.

**Параметры:**
- `source`: Источник энергии (`Source`).

**Возвращает:**
Код результата Screeps.

**Пример:**
```typescript
creep.storage.harvest(source);
```

### storage.pickup

Пытается подобрать упавшую энергию.

**Параметры:**
- `resource`: Ресурс на земле.

**Возвращает:**
Код результата Screeps.

**Пример:**
```typescript
creep.storage.pickup(droppedEnergy);
```

### storage.transfer

Передает энергию цели (структуре или другому крипу).

**Параметры:**
- `target`: Получатель энергии.
- `amount`: (Опционально) Количество энергии.

**Возвращает:**
Код результата Screeps.

**Пример:**
```typescript
creep.storage.transfer(spawn);
```

---

## Runner

Класс `Runner` управляет жизненным циклом крипов в комнате.

### maintainCreepPopulation

Обеспечивает наличие определенного количества крипов заданного типа и уровня. Если крипов не хватает, создает новых.

**Параметры:**
- `creepType`: Тип крипа (например, `CreepType.Harvester`).
- `creepLevel`: Уровень крипа.
- `targetNumber`: Целевое количество.

**Пример:**
```typescript
runner.maintainCreepPopulation(CreepType.Harvester, 1, 3);
```

### forEachCreepOfType

Выполняет функцию для каждого крипа заданного типа.

**Параметры:**
- `creepType`: Тип крипа.
- `creepLevel`: (Опционально) Уровень крипа.
- `handler`: Функция-обработчик, принимающая `CreepWrapper`.

**Пример:**
```typescript
runner.forEachCreepOfType(CreepType.Harvester, 1, (creep) => {
    // Логика харвестера
});
```
