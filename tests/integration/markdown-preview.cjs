async (page) => {
  await page.getByRole('button', { name: 'Project folder Refactor store' }).click();
  await page.getByRole('tab', { name: 'Files' }).click();
  await page.getByRole('treeitem', { name: /^README\.md\b/ }).click();

  const source = [
    '# Rich preview',
    '',
    '```mermaid',
    'flowchart LR',
    '  Start --> Finish',
    '```',
    '',
    '```chart',
    '{"width":220,"height":120,"data":{"values":[{"name":"Example","value":3}]},"mark":"bar","encoding":{"x":{"field":"name","type":"nominal"},"y":{"field":"value","type":"quantitative"}}}',
    '```',
  ].join('\n');
  await page.getByLabel('File contents').fill(source);
  await page.getByRole('button', { name: 'Preview', exact: true }).click();

  const preview = page.getByRole('region', { name: 'Markdown preview' });
  await preview.getByRole('heading', { name: 'Rich preview' }).waitFor();
  const diagram = preview.getByTestId('mermaid');
  await diagram.locator('svg .node').filter({ hasText: 'Finish' }).waitFor({ timeout: 15000 });

  const chart = preview.getByTestId('chart');
  await chart.scrollIntoViewIfNeeded();
  await chart.locator('svg .mark-rect path').first().waitFor({ timeout: 15000 });

  await page.getByRole('button', { name: 'Source', exact: true }).first().click();
  await page.getByLabel('File contents').getByText('flowchart LR', { exact: true }).waitFor();
}
