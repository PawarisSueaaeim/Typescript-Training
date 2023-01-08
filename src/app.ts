// Project type more classes & custom type
enum ProjectStatus { Active , Finished } // สามารถกำหนดได้ว่า type ตัวแปรที่ต้องการให้เป็นมีอะไรบ้าง เช่นตัวนี้จะมี typr สองอันเป็น Active และ Finish

class Project { // สร้าง class project ที่สามารถเก็บ type ของตัวแปรได้หลาย type แล้วเอาไปใช้แทน any
    constructor(
        public id: string, 
        public title: string, 
        public description: string, 
        public people: number, 
        public status: ProjectStatus) {

    }
}

// Class projects state management
type Listener = (Items: Project[]) => void; // สร้าง type ครอบ class ที่สามารถเก็บได้หลาย type อีกทีนึงได้

class ProjectState {
    private listeners: Listener[] = [];
    private projects: Project[] = [];
    private static instance = new ProjectState();

    private constructor() {

    };

    static getInstance() {
        if (this.instance){
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }

    addListener(listenerFn: Listener) {
        this.listeners.push(listenerFn);
    }

    addProject(title: string, description: string, numberOfPeople: number) {
        const newProjects = new Project(
            Math.random().toString(),
            title,
            description,
            numberOfPeople,
            ProjectStatus.Active
        );
        this.projects.push(newProjects);
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}

const projectState = ProjectState.getInstance();

interface Validateable {
    value: string | number ,
    required?: boolean,
    minLength?: number,
    maxLength?: number,
    min?: number,
    max?: number,
}

function validate( validateableInput: Validateable) { // สร้าง function เพื่อตรวจสอบ input
    let isValid = true; // set ตัวแปร isValid เป็น true
    if (validateableInput.required) { // รับ req มา เลือกเป็นตัว required 
        isValid = isValid && validateableInput.value.toString().trim().length !== 0; //  เอามาเช็คว่าตัวแปรที่เข้ามามีค่าไม่เท่ากับ 0 
    }
    if ( validateableInput.minLength != null && typeof validateableInput.value === 'string' ){ // ถ้าความยาวไม่เท่ากับ null และค่าของ input เป็น string
        isValid = isValid && validateableInput.value.length >= validateableInput.minLength;
    }
    if (validateableInput.maxLength != null && typeof validateableInput.value === 'string' ){
        isValid = isValid && validateableInput.value.length <= validateableInput.maxLength;
    }
    if (validateableInput.min != null && typeof validateableInput.value === 'number'){
        isValid = isValid && validateableInput.value >= validateableInput.min;
    }
    if (validateableInput.max != null && typeof validateableInput.value === 'number'){
        isValid = isValid && validateableInput.value <= validateableInput.max;
    }
    return isValid;
}

function autobind(_: any ,_2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor:PropertyDescriptor = {
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn
        }
    }
    return adjDescriptor;
};

// Component base class adding inheritance and generic
abstract class Component <T extends HTMLElement, U extends HTMLElement >{ // สามารถประกาศ type แบบนี้ได้ (inheritance)
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(
        templateId: string,
        hostElementId: string,
        insertAtStart: boolean,
        newElementId: string,
    ){
        this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostElementId)! as T;

        const importedNode = document.importNode(this.templateElement.content, true);

        this.element = importedNode.firstElementChild as U;
        if(newElementId) {
            this.element.id = newElementId;
        }

        this.attach(insertAtStart);
    }

    private attach(insertBegining: boolean) {
        this.hostElement.insertAdjacentElement(insertBegining ? 'afterbegin' : 'beforeend', this.element)
    }

    abstract configure(): void
    abstract renderContent(): void
}

// ProjectList Class
class ProjectList extends Component<HTMLDivElement, HTMLElement> { // สร้างตัวแปรและ ประกาศ type โดยใช้ component
    assignedProjects: Project[];

    constructor(private type: 'active' | 'finished'){ // เราจะสามารถส่งค่าผ่าน supper() ได้เลย
        super('project-list', 'app', false ,`${type}-projects`); // ซึ่งปกติจะส่งโดยใช้ getElementById แล้วก็ต้องมี as HTMLTemplateElement ยาวๆ
        this.assignedProjects = [];

        projectState.addListener((project: Project[]) => {
            const releventProject = project.filter(prj => { // สร้างตัวที่เอาไว้ return ว่าตัวที่ add เข้ามาอยู่ status ไหน
                if(this.type == 'active') {
                    return prj.status === ProjectStatus.Active;
                }else{
                    return prj.status === ProjectStatus.Finished;
                }
            });
            this.assignedProjects = releventProject; // แล้วเอามายัดเข้าตัวแปรที่จะเอาไปแสดง
            this.renderProjects(); // และ call renderProjects
        })
        this.renderContent(); // call renderContent
    }

    configure(): void {}

    renderContent () {
        const listId =  `${this.type}-project-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + 'PROJECTS';
    }

    private renderProjects () {  // function เอาไว้รันสร้าง list project ที่กด add เข้ามา
        const listEl =  document.getElementById(`${this.type}-project-list`)! as HTMLUListElement; // สร้างตัวแปรเพื่อเก็บก่อนว่าจะเอาไปสร้างที่ active หรือ finished
        listEl.innerHTML = '';
        for (const prjItem of this.assignedProjects) {
            const listItem = document.createElement('li');
            listItem.textContent = prjItem.title;
            listEl.appendChild(listItem);
        }
    }
}

// ProjectInput class
class ProjectInput { // ประกาศตัวแปร และ type ของตัวแปร
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement; // นำตัวแปรด้านบนมาเก็บค่าแต่ละ element โดยใช้ id
        this.hostElement = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateElement.content, true); // 

        this.element = importedNode.firstElementChild as HTMLFormElement;
        this.element.id = 'user-input';

        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

        this.config();
        this.attach();
    }

    // ส่วนของการ Input ข้อมูล 
    private getherUserInput (): [string, string, number] | undefined { // ประกาศ function ชื่อว่า getherUserInput รับค่า 3 ชนิด
        const enteredTitle = this.titleInputElement.value;  // สร้างตัวแปรเพื่อรับค่าของ input ของ titleInputElement
        const enteredDescription = this.descriptionInputElement.value; // สร้างตัวแปรเพื่อรับค่า input ของ descriptionInputElement
        const enteredPeople = this.peopleInputElement.value; // สร้างตัวแปรเพื่อรับค่า input ของ peopleInputElement

        const titleValidate: Validateable = { // สร้างตัวแปร titleValidate เพื่อเก็บค่า value, required, minLength เพื่อเอาไปตรวจสอบ
            value: enteredTitle,  // จับตัวแปร enteredTitle ยัดลงไป
            required: true,
            minLength: 3, // เพื่อเอาไว้กำหนดว่าจะต้องมีความยาวต่ำสุดเท่าไหร่
        }
        const descriptionValidate: Validateable = { // สร้างตัวแปร descriptionValidate เพื่อเก็บค่า ต่อไปนี้
            value: enteredDescription, // จับตัวแปร enteredDescription ยัดลงไป
            required: true,
            minLength: 10, 
            max: 500, // เพื่อกำหนดจำนวนสูงสุด
        }
        const peopleValidate: Validateable = { // สร้างตัวแปรเพื่อเก็บค่า input ไปตรวจสอบ
            value: enteredPeople,
            required: true,
            min: 5,
            max: 10,
        }

        // เอาตัวแปรด้านบนมา call function validate ถ้าอันใดอันนึงผิด
        if (!validate(titleValidate) || !validate(descriptionValidate) || !validate(peopleValidate)) {
            alert('invalid input please try again!!') // ให้มันแสดงข้อความเตือน
            return;
        }else{
            return [enteredTitle, enteredDescription, +enteredPeople]; // แสดงค่าของตัวแปรที่ผ่าน
        }
    }

    private clearInput () { // สร้าง Function เอาไว้เคลียร์ input
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }

    @autobind // สร้าง function ในการจัดการการกด add project
    private submitHandler (event: Event) {
        event.preventDefault();
        const userInput = this.getherUserInput();

        if (Array.isArray(userInput)) {
            const [title, desc, people] = userInput;
            projectState.addProject(title, desc, people);
            console.log(title,desc,people);
            this.clearInput();
        }
    }

    private config () {
        this.element.addEventListener('submit', this.submitHandler.bind(this));    
    }

    private attach () {
        this.hostElement.insertAdjacentElement('afterbegin', this.element)
    }
}

const prjInput = new ProjectInput();
const activeProjectsList = new ProjectList('active');
const finishedProjectsList = new ProjectList('finished');