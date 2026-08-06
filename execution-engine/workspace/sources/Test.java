public class Test {

    public static void main(String[] args){

        factorial(3);

    }

    static int factorial(int n){

        if(n==0)
            return 1;

        int result = n * factorial(n-1);

        return result;

    }

}
