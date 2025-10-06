import '../../styles/warehouse.css';

type StatusBarProps = {
  status?: string;
};

export const StatusBar = ({ status }: StatusBarProps) => (
  <footer className='status-bar'>
    <span className='status-bar__item'>Склад: Основной</span>
    <span className='status-bar__item'>Пользователь: Тестовый Руководитель</span>
    <span className='status-bar__item'>Соединение: онлайн</span>
    <span className='status-bar__item'>{status ?? new Date().toLocaleString('ru-RU')}</span>
  </footer>
);
