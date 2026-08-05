public class Test {

    public static void main(String[] args) {

        factorial(3);

    }

    static int factorial(int n){

        if(n==0)
            return 1;

        return n*factorial(n-1);

    }

}
