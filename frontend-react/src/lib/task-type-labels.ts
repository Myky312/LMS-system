/** Подписи типов заданий API для интерфейса. */
export function taskTypeLabelRu(type: string): string {
  switch (type) {
    case "QUIZ":
      return "Тест";
    case "AUDIO":
      return "Аудио";
    case "PHOTO":
      return "Фото";
    default:
      return type;
  }
}
