import { ItemForm, type ItemFormTab } from '../../../layout/ItemForm/ItemForm';

export type ItemCardProps = {
  open: boolean;
  onClose: () => void;
};

export const ItemCard = ({ open, onClose }: ItemCardProps) => {
  if (!open) {
    return null;
  }

  const tabs: ItemFormTab[] = [
    { id: 'general', label: 'Общее', content: <p>Основная информация по элементу номенклатуры.</p> },
    { id: 'extra', label: 'Дополнительно', content: <p>Дополнительные поля будут добавлены позднее.</p> },
    { id: 'history', label: 'История', content: <p>История изменений появится после интеграции с API.</p> }
  ];

  return <ItemForm title='Карточка номенклатуры' tabs={tabs} onClose={onClose} />;
};

export default ItemCard;
