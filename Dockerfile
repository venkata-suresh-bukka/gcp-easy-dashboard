FROM nginx:alpine

RUN apk update \
    && apk add --virtual build-deps gcc python3-dev musl-dev \
    && apk add --no-cache mariadb-dev

RUN apk update && \
    apk --no-cache add python3 py3-pip mariadb-dev build-base && \
    pip install --upgrade pip && \
    pip install --no-cache --upgrade pip setuptools

COPY default.conf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf

COPY certs/gcpeasy.pem /etc/nginx/gcpeasy.pem
COPY certs/gcpeasy.key /etc/nginx/gcpeasy.key

WORKDIR /opt/app
COPY . .

RUN pip install gunicorn
RUN pip install -r requirements.txt
RUN pip install --upgrade requests
RUN pip install --upgrade hvac
RUN apk del build-deps

EXPOSE 8000
ENTRYPOINT ["sh", "/opt/app/backend_startup/start.sh"]
