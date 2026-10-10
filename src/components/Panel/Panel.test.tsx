import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Panel } from './Panel';

describe('Panel', () => {
    it('is a region labelled by its title', () => {
        render(
            <Panel title="Spending over time" description="Daily totals">
                <p>Content</p>
            </Panel>,
        );

        const region = screen.getByRole('region', { name: 'Spending over time' });
        expect(region).toHaveTextContent('Daily totals');
        expect(region).toHaveTextContent('Content');
    });
});