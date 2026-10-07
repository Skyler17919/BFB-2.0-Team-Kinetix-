import os, zipfile, shutil
zip_path = r'D:\hackthon\VeloSkillBackend.zip'
out_dir = r'D:\hackthon\veloskillbackend_unpack'
log_path = r'D:\hackthon\BFB-2.0-Team-Kinetix-\zip_inspect_log.txt'
with open(log_path, 'w', encoding='utf-8') as log:
    log.write(f'ZIP_EXISTS={os.path.exists(zip_path)}\n')
    if os.path.exists(zip_path):
        with zipfile.ZipFile(zip_path) as zf:
            names = zf.namelist()
            log.write(f'NAMES={len(names)}\n')
            for name in names:
                log.write(name + '\n')
            os.makedirs(out_dir, exist_ok=True)
            for info in zf.infolist():
                if info.is_dir():
                    continue
                rel = info.filename.replace('\\', '/')
                if rel.startswith('models/') or rel.startswith('data/') or rel.startswith('services/'):
                    dst = os.path.join(out_dir, rel)
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    if not os.path.exists(dst):
                        with zf.open(info, 'r') as src, open(dst, 'wb') as f:
                            shutil.copyfileobj(src, f)
            log.write(f'EXTRACTED_TO={out_dir}\n')
            for base, _, files in os.walk(out_dir):
                for file in files:
                    log.write(os.path.relpath(os.path.join(base, file), out_dir) + '\n')
