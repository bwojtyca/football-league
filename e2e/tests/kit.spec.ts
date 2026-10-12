import { expect, test } from '@playwright/test';

import { addPlayers, createLeague, players, shot, startGame, t, tag } from './helpers';

test('a kit: chosen on the profile, worn by the avatar', async ({ page }) => {
  const id = tag();
  const [a, b] = players(id);
  await createLeague(page, `E2E koszulki ${id}`);
  await addPlayers(page, [a, b]);
  await page.locator('fl-ranking').getByText(a).click();

  // Without a kit, the initials.
  const avatar = page.locator('section.hero fl-avatar');
  await expect(avatar).toHaveText(/\w/);
  await expect(avatar).not.toHaveClass(/with-kit/);

  await page
    .locator('section.hero')
    .getByRole('button', { name: t('kit.title') })
    .click();
  const editor = page.locator('fl-kit-dialog');
  await editor.getByRole('radio', { name: t('kit.patterns.stripes') }).click();
  await editor
    .getByRole('radiogroup', { name: t('kit.c1') })
    .getByRole('radio', { name: t('kit.colors.white') })
    .click();
  await editor
    .getByRole('radiogroup', { name: t('kit.c2') })
    .getByRole('radio', { name: t('kit.colors.black') })
    .click();
  await editor.getByRole('button', { name: t('kit.more') }).click();
  await expect(editor.locator('output')).toHaveText('10');
  await shot(page, 'kit-editor');
  await editor.getByRole('button', { name: t('kit.save') }).click();
  await expect(editor).toBeHidden();

  // The figure in the kit, with its number; it is saved on the player, so it stays.
  await expect(avatar).toHaveClass(/with-kit/);
  await expect(avatar.locator('text')).toHaveText('10');
  await shot(page, 'profile-kit');
  await page.reload();
  await expect(avatar).toHaveClass(/with-kit/);

  // Without a number, the shirt is plain.
  await page
    .locator('section.hero')
    .getByRole('button', { name: t('kit.title') })
    .click();
  for (let i = 0; i < 10; i++) {
    await editor.getByRole('button', { name: t('kit.less') }).click();
  }
  await expect(editor.locator('output')).toHaveText(t('kit.noNumber'));
  await expect(editor.getByRole('button', { name: t('kit.less') })).toBeDisabled();
  await editor.getByRole('button', { name: t('kit.save') }).click();
  await expect(avatar.locator('text')).toHaveCount(0);

  // In a game, the board at the player's end of the table shows the figure next to the name.
  await page
    .locator('nav.tabs')
    .getByRole('link', { name: t('nav.ranking') })
    .click();
  await startGame(page, { red: [a], blue: [b] });
  await expect(page.locator('fl-table .board fl-avatar.with-kit')).toHaveCount(1);
  await shot(page, 'game-kit');
});
