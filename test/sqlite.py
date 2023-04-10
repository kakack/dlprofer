import sqlite3

conn = sqlite3.connect('example.db')

cursor = conn.cursor()

sql ='''CREATE TABLE TRACERECORD(
   IC BIGINT NOT NULL PRIMARY KEY,
   NAME CHAR(40) NOT NULL,
   OP CHAR(1) NOT NULL
)'''

cursor.execute(sql)

cursor.execute('''INSERT INTO TRACERECORD(
   IC, NAME, OP) VALUES 
   (1, 'helloworld', 'c')''')

cursor.execute('''INSERT INTO TRACERECORD(
   IC, NAME, OP) VALUES 
   (2, 'helloworld', 'r')''')

cursor.execute('''SELECT * from TRACERECORD''')
result = cursor.fetchall()
print(result)


conn.commit()
conn.close()
