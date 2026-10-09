import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

for (const phase of ['database', 'health']) test(`deployment failure during ${phase} restores the original bundle and dependencies`, async () => {
  // Only orchestration/filesystem recovery is exercised here. All process/database
  // commands are stubs; the source script's production paths are replaced first.
  const root = await mkdtemp(join(tmpdir(), 'samsung-deploy-test-'));
  const live = join(root,'live'); const stage = join(root,'stage'); const bin = join(root,'bin');
  const backups = join(root,'backups');
  const put = async (path, content, mode) => { await mkdir(join(path,'..'),{recursive:true}); await writeFile(path,content,mode ? {mode} : undefined); };
  try {
    for(const dir of [live,stage,bin]) await mkdir(dir,{recursive:true});
    for(const name of ['dist','node_modules','src','api','db','contracts','tests','docs','scripts']) {
      await put(join(live,name,'fixture.txt'),'old'); await put(join(stage,name,'fixture.txt'),'new');
    }
    // Contracts are preflighted rather than overwritten.
    await put(join(stage,'contracts','fixture.txt'),'old');
    await put(join(live,'package.json'),'old-package'); await put(join(live,'package-lock.json'),'old-lock');
    await put(join(stage,'package.json'),'new-package'); await put(join(stage,'package-lock.json'),'new-lock');
    for(const file of ['index.html','vite.config.ts']) { await put(join(live,file),'old'); await put(join(stage,file),'new'); }
    let script=await readFile(new URL('../scripts/deploy-vps.sh',import.meta.url),'utf8');
    script=script.replaceAll('/opt/samsung-store-mx',live).replaceAll('/opt/samsung-backups',backups).replaceAll('/var/lock/samsung-store-deploy.lock',join(root,'lock'));
    assert.ok(!script.includes('/opt/samsung-store-mx')); assert.ok(!script.includes('/opt/samsung-backups'));
    await put(join(stage,'scripts/deploy-vps.sh'),script);
    const stubs={
      id: '#!/bin/bash\nprintf "0\\n"\n',
      git: `#!/bin/bash\ncase "$*" in *rev-parse*) printf '%s\\n' "$TEST_SHA";; esac\n`,
      npm: '#!/bin/bash\nexit 0\n',
      curl: '#!/bin/bash\nexit 0\n',
      mysqldump: '#!/bin/bash\nexit 0\n',
      pm2: '#!/bin/bash\nprintf "%s\\n" "$*" >> "$TEST_LOG"\nif test "$1" = jlist; then printf "[]"; fi\n',
      node: '#!/bin/bash\nif test "$1" = --input-type=module; then cat >/dev/null; fi\nif test "$TEST_PHASE" = database && test "$1" = scripts/vps-db.mjs && test "$2" = backup-migrate; then exit 23; fi\nif test "$TEST_PHASE" = health && [[ "$1" = */scripts/vps-health.mjs ]] && test "$2" = live; then exit 24; fi\nexit 0\n',
      rsync: '#!/bin/bash\nargs=(); for value in "$@"; do if [[ "$value" != -* ]]; then args+=("$value"); fi; done\nlast=$((${#args[@]}-1)); destination=${args[$last]}; unset "args[$last]"\ncp -a "${args[@]}" "$destination"\n',
    };
    for(const [name,body] of Object.entries(stubs)) await put(join(bin,name),body,0o700);
    const child=spawn('bash',[join(stage,'scripts/deploy-vps.sh'),'fixture-sha'],{env:{...process.env,PATH:`${bin}:${process.env.PATH}`,TEST_SHA:'fixture-sha',TEST_PHASE:phase,TEST_LOG:join(root,'pm2.log')}});
    let output=''; child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
    const status=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
    assert.notEqual(status,0,output);
    assert.match(output,/restoring the previous application/,output);
    assert.equal(await readFile(join(live,'dist/fixture.txt'),'utf8'),'old');
    assert.equal(await readFile(join(live,'node_modules/fixture.txt'),'utf8'),'old');
    assert.equal(await readFile(join(live,'src/fixture.txt'),'utf8'),'old');
    assert.equal(await readFile(join(live,'package.json'),'utf8'),'old-package');
    const log=await readFile(join(root,'pm2.log'),'utf8');
    assert.match(log,/stop samsung-store/); assert.match(log,/restart samsung-store --update-env/);
    assert.doesNotMatch(log,/save/);
    assert.equal((await readdir(backups)).length,1);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test('production baseline checks authored source and excludes the image manifest regenerated from VPS media', async () => {
  const baseline=JSON.parse(await readFile(new URL('../docs/vps-source-manifest.json',import.meta.url),'utf8'));
  assert.equal(Object.hasOwn(baseline,'src/generated/image-manifest.json'),false);
  for(const path of ['src/pages/Home.tsx','api/boot.ts','package-lock.json','scripts/deploy-vps.sh'])
    assert.match(baseline[path],/^[a-f0-9]{64}$/);
  const optimizer=await readFile(new URL('../scripts/optimize-images.mjs',import.meta.url),'utf8');
  assert.ok(optimizer.includes("writeFile('src/generated/image-manifest.json'"));
});
