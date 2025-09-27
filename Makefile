dev311:
	conda run -n finpulse311 python app.py

ingest311:
	conda run -n finpulse311 python -m flask --app app:create_app ingest-news

