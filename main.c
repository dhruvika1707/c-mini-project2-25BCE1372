#include <bits/stdc++.h>
using namespace std;

class Booking{
public:
    int id; string name; vector<int> seats; double amount;
    Booking(int i,string n,vector<int> s,double a):id(i),name(n),seats(s),amount(a){}
};

class Show{
    vector<bool> seat; // true = booked
public:
    Show(){seat.assign(50,false);}
    void load(){ifstream f("seats.txt"); for(int i=0;i<50&&f;i++) f>>seat[i];}
    void save(){ofstream f("seats.txt"); for(bool s:seat) f<<s<<" ";}
    void display(){
        for(int i=0;i<50;i++){
            cout<<setw(3)<<i+1<<(seat[i]?"[X]":"[ ]");
            if((i+1)%10==0) cout<<"\n";
        }
    }
    bool isAvailable(int x){return x>=1&&x<=50&&!seat[x-1];}
    void book(vector<int> v){for(int x:v) seat[x-1]=true;}
    int available(){return count(seat.begin(),seat.end(),false);}
    int booked(){return 50-available();}
};

class TheatreSystem{
    Show show; int nextID=1000;
public:
    TheatreSystem(){show.load();}
    ~TheatreSystem(){show.save();}
    
    void bookSeats(){
        string name; int n,x; vector<int> v;
        cout<<"Name: "; cin>>name;
        cout<<"No. of seats: "; cin>>n;
        set<int> st;
        for(int i=0;i<n;i++){
            cin>>x;
            if(!show.isAvailable(x)||st.count(x)){cout<<"Invalid/duplicate seat!\n";return;}
            st.insert(x); v.push_back(x);
        }
        show.book(v);
        double amt=n*200;
        ofstream f("bookings.txt",ios::app);
        f<<nextID<<" "<<name<<" "<<n<<" ";
        for(int s:v) f<<s<<" ";
        f<<amt<<"\n";
        cout<<"Booked! ID="<<nextID++<<" Amount="<<amt<<"\n";
    }

    void search(){
        int id; cout<<"Enter ID: "; cin>>id;
        ifstream f("bookings.txt");
        int bid,n; string name; double amt;
        while(f>>bid>>name>>n){
            vector<int> v(n); for(int i=0;i<n;i++) f>>v[i];
            f>>amt;
            if(bid==id){
                cout<<"Name:"<<name<<" Seats:";
                for(int x:v) cout<<x<<" ";
                cout<<" Amount:"<<amt<<"\n"; return;
            }
        }
        cout<<"Not found\n";
    }

    void report(){
        cout<<"Booked:"<<show.booked()<<" Available:"<<show.available()<<"\n";
        cout<<"Occupancy:"<< (show.booked()*100.0/50) <<"%\n";
    }

    void menu(){
        int ch;
        do{
            cout<<"\n1.Display\n2.Book\n3.Search\n4.Report\n0.Exit\nChoice: ";
            cin>>ch;
            switch(ch){
                case 1: show.display(); break;
                case 2: bookSeats(); break;
                case 3: search(); break;
                case 4: report(); break;
            }
        }while(ch);
    }
};

int main(){
    TheatreSystem t;
    t.menu();
}