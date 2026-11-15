import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/renderApp';

describe('end-to-end navigation', () => {
  it('goes from the homepage to a module and into the first lesson', async () => {
    const user = userEvent.setup();
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'Korean Foundations' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Verb Tenses in Everyday Sentences' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Verb Tenses in Everyday Sentences' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Present and Past' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Future' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Continuous / Progressive' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Start Present and Past' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Talking about what you do and did' })).toBeInTheDocument();
  });

  it('review page searches vocabulary and links to the source lesson', async () => {
    const user = userEvent.setup();
    renderApp('/review');
    await user.type(screen.getByRole('searchbox'), 'coffee');
    expect(screen.getByRole('article', { name: '커피: coffee' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: '먹다: to eat' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Introduced in Section 2' }));
    expect(screen.getByRole('heading', { level: 1, name: 'New words: people, places, and things' })).toBeInTheDocument();
  });

  it('planned modules render without dead links', () => {
    renderApp('/journeys/korean-foundations');
    expect(screen.getByRole('heading', { name: 'Questions and Negation' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Questions and Negation' })).not.toBeInTheDocument();
  });

  it('print view renders the section with an answer key', () => {
    renderApp('/print/verb-tenses/section-future');
    expect(screen.getByRole('heading', { level: 1, name: 'Future' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Answer key' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Play pronunciation/ })).not.toBeInTheDocument();
  });
});
