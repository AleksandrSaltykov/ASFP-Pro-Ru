import type { WarehouseCommand } from '../types';
import '../../styles/warehouse.css';

export type CommandBarProps = {
  commands: WarehouseCommand[];
  onCommand?: (commandId: string) => void;
};

export const CommandBar = ({ commands, onCommand }: CommandBarProps) => (
  <div className='command-bar'>
    {commands.map((command) => (
      <button
        key={command.id}
        type='button'
        className='command-bar__button'
        onClick={() => onCommand?.(command.id)}
        disabled={command.disabled}
      >
        {command.label}
      </button>
    ))}
  </div>
);
