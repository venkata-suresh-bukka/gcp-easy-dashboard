FROM nginx:alpine
RUN apk update
# ARG DB_USER
# ARG DB_PASSWORD
# ARG DB_HOST
# ARG DB_PORT
RUN apk update && \
    apk --no-cache add python3-dev py3-pip && \
    pip3 install --upgrade pip && \
    pip3 install --no-cache --upgrade pip setuptools 
    
RUN python3 -m ensurepip

COPY default.conf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf

WORKDIR /opt/app
COPY . .
RUN pip install gunicorn
RUN pip install -r requirements.txt
# ENV DB_USER=$DB_USER
# ENV DB_PASSWORD=$DB_PASSWORD
# ENV DB_HOST=$DB_HOST
# ENV DB_PORT=$DB_PORT

#aws access
# ENV AWS_ACCESS_KEY_ID=$USER
# ENV AWS_SECRET_ACCESS_KEY=$PASSWORD

EXPOSE 8000
ENTRYPOINT ["sh", "/opt/app/backend_startup/start.sh"]  

