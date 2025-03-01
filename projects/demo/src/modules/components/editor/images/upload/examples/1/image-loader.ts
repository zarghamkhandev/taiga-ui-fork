import {fromEvent, Observable} from 'rxjs';
import {finalize, map, switchMap} from 'rxjs/operators';

import {ImgbbService} from './imgbb.service';

export function imageLoader(service: ImgbbService): (file: File) => Observable<string> {
    return (file: File) => {
        const fileReader = new FileReader();

        service.loading$.next(true);
        fileReader.readAsDataURL(file);

        return fromEvent(fileReader, `load`).pipe(
            map(() => String(fileReader.result)),
            switchMap(base64 => service.save(base64)),
            finalize(() => service.loading$.next(false)),
        );
    };
}
