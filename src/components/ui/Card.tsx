/**
 * Reusable Card Component with Centralized Theme
 * Demonstrates the new theme system
 */
import { theme } from '../../lib/config/theme';
import type { JSX } from 'solid-js';

interface CardProps {
  title?: string;
  children: JSX.Element;
  className?: string;
}

export function Card(props: CardProps) {
  return (
    <div class={`${theme.cardBg} ${theme.border} rounded-lg shadow-md p-6 ${props.className || ''}`}>
      {props.title && (
        <h2 class={`text-xl font-bold ${theme.textHeading} mb-4`}>
          {props.title}
        </h2>
      )}
      <div class={theme.textBody}>
        {props.children}
      </div>
    </div>
  );
}
