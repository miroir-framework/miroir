export interface ThemedComponentProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  onClick?: (event: any) => void;
  value?: any;
  onChange?: (event: any) => void;
  name?: string;
  labelId?: string;
  label?: string;
  padding?: string | number;
  variant?: string; // Allow any string for flexibility
  role?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  title?: string;
  disabled?: boolean;
  hideScrollbar?: boolean; // New prop to control scrollbar visibility
}
